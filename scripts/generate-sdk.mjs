import { mkdir, rm, writeFile, readFile, copyFile, constants } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const tempRoot = path.join(root, '.tmp')
const releaseRoot = path.join(root, 'release')
const docsRoot = path.join(root, 'docs', 'readme') // 存放 README 模板的目录

const targets = {
  h5: {
    entry: 'src/entries/h5.ts',
    outDir: 'tracker-sdk-h5',
    packageName: 'tracker-sdk-h5',
    description: 'H5 tracker SDK for web applications.',
    external: []
  },
  'taro-weapp': {
    entry: 'src/entries/taro-weapp.ts',
    outDir: 'tracker-sdk-taro-weapp',
    packageName: 'tracker-sdk-taro-weapp',
    description: 'Taro WeChat mini program tracker SDK.',
    external: ['@tarojs/taro']
  },
  'taro-alipay': {
    entry: 'src/entries/taro-alipay.ts',
    outDir: 'tracker-sdk-taro-alipay',
    packageName: 'tracker-sdk-taro-alipay',
    description: 'Taro Alipay mini program tracker SDK.',
    external: ['@tarojs/taro']
  }
}

const input = process.argv[2] ?? 'all'
const selectedTargets = input === 'all' ? Object.keys(targets) : [input]

for (const target of selectedTargets) {
  if (!targets[target]) {
    console.error(`Unsupported target: ${target}`)
    process.exit(1)
  }
}

await mkdir(tempRoot, { recursive: true })
await mkdir(releaseRoot, { recursive: true })

for (const target of selectedTargets) {
  const config = targets[target]
  const tempDir = path.join(tempRoot, target)
  const packageDir = path.join(releaseRoot, config.outDir)

  await rm(tempDir, { recursive: true, force: true })
  // 重新创建整个 package 目录，确保干净
  await rm(packageDir, { recursive: true, force: true })
  await mkdir(tempDir, { recursive: true })
  await mkdir(packageDir, { recursive: true })

  await runTsup(config, tempDir)

  const manifest = {
    name: config.packageName,
    version: "0.2.0",
    description: config.description,
    main: `./dist/${target}.js`,
    module: `./dist/${target}.mjs`,
    types: `./dist/${target}.d.ts`,
    exports: {
      ".": {
        import: `./dist/${target}.mjs`,
        require: `./dist/${target}.js`,
        types: `./dist/${target}.d.ts`,
      },
    },
    files: ["dist", "README.md"],
    keywords: ["tracker", "analytics", "埋点"],
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/xujiongx/tracker-sdk",
    },
    author: "xujiong",
    peerDependencies: config.external.includes("@tarojs/taro")
      ? {
          "@tarojs/taro": ">=3.0.0",
        }
      : undefined,
  };

  // 创建 dist 目录
  const distDir = path.join(packageDir, 'dist')
  
  // 复制编译后的文件
  await copyDir(tempDir, distDir)
  
  // 写入 package.json
  await writeFile(path.join(packageDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  
  // 复制对应的 README.md 文件
  const readmeSource = path.join(docsRoot, `${target}.md`)
  const readmeTarget = path.join(packageDir, 'README.md')
  
  try {
    await copyFile(readmeSource, readmeTarget, constants.COPYFILE_EXCL)
    console.log(`Copying README for ${target} from ${readmeSource}`)
  } catch (err) {
    // 如果找不到模板文件，创建一个简单的 README
    const platformLabel = {
      h5: 'H5',
      'taro-weapp': 'Taro 微信小程序',
      'taro-alipay': 'Taro 支付宝小程序'
    }[target]
    
    const factoryName = {
      h5: 'createH5Tracker',
      'taro-weapp': 'createTaroWeappTracker',
      'taro-alipay': 'createTaroAlipayTracker'
    }[target]
    
    const fallbackReadme = `# ${platformLabel} Tracker SDK

本目录为本地生成的 SDK 文件包，无需发布到 npm。

## 使用方式

\`\`\`ts
import { ${factoryName} } from './dist/${target}.mjs'

const tracker = ${factoryName}({
  appId: 'goal_app',
  endpoint: 'https://example.com/api/track/batch'
})
\`\`\`
`
    
    await writeFile(readmeTarget, fallbackReadme, 'utf8')
    console.log(`Created fallback README for ${target}`)
  }

  console.log(`Generated ${target} package at ${packageDir}`)
}

async function runTsup(config, tempDir) {
  const args = [
    'tsup',
    config.entry,
    '--format',
    'esm,cjs',
    '--dts',
    '--clean',
    '--sourcemap',
    '--out-dir',
    tempDir
  ]

  for (const dependency of config.external) {
    args.push('--external', dependency)
  }

  await runProcess(process.platform === 'win32' ? 'npx.cmd' : 'npx', args)
}

async function copyDir(source, target) {
  await mkdir(target, { recursive: true })
  const entries = await import('node:fs/promises').then((fs) => fs.readdir(source, { withFileTypes: true }))

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath)
      continue
    }

    const content = await import('node:fs/promises').then((fs) => fs.readFile(sourcePath))
    await writeFile(targetPath, content)
  }
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      shell: false,
      env: process.env
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })

    child.on('error', reject)
  })
}
