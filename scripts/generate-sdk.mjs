import { mkdir, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const tempRoot = path.join(root, '.tmp')
const releaseRoot = path.join(root, 'release')

const targets = {
  h5: {
    entry: 'src/entries/h5.ts',
    outDir: 'tracker-sdk-h5',
    packageName: '@local/tracker-sdk-h5',
    description: 'Local file package for H5 tracker SDK.',
    external: []
  },
  'taro-weapp': {
    entry: 'src/entries/taro-weapp.ts',
    outDir: 'tracker-sdk-taro-weapp',
    packageName: '@local/tracker-sdk-taro-weapp',
    description: 'Local file package for Taro WeChat mini program tracker SDK.',
    external: ['@tarojs/taro']
  },
  'taro-alipay': {
    entry: 'src/entries/taro-alipay.ts',
    outDir: 'tracker-sdk-taro-alipay',
    packageName: '@local/tracker-sdk-taro-alipay',
    description: 'Local file package for Taro Alipay mini program tracker SDK.',
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
  await rm(packageDir, { recursive: true, force: true })
  await mkdir(tempDir, { recursive: true })
  await mkdir(packageDir, { recursive: true })

  await runTsup(config, tempDir)

  const manifest = {
    name: config.packageName,
    version: '0.1.0',
    private: true,
    description: config.description,
    main: `./dist/${target}.js`,
    module: `./dist/${target}.mjs`,
    types: `./dist/${target}.d.ts`,
    files: ['dist', 'README.md'],
    peerDependencies: config.external.includes('@tarojs/taro')
      ? {
          '@tarojs/taro': '>=3.0.0'
        }
      : undefined
  }

  const readme = renderReadme(target)

  await copyDir(tempDir, path.join(packageDir, 'dist'))
  await writeFile(path.join(packageDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await writeFile(path.join(packageDir, 'README.md'), readme, 'utf8')

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

function renderReadme(target) {
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

  return `# ${platformLabel} Tracker SDK\n\n本目录为本地生成的 SDK 文件包，无需发布到 npm。\n\n## 使用方式\n\n\`\`\`ts\nimport { ${factoryName} } from './dist/index.js'\n\nconst tracker = ${factoryName}({\n  appId: 'goal_app',\n  endpoint: 'https://example.com/api/track/batch'\n})\n\`\`\`\n`
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
