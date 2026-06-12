#!/usr/bin/env node
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const releaseRoot = path.join(root, 'release')

const packages = [
  'tracker-sdk-h5',
  'tracker-sdk-taro-weapp',
  'tracker-sdk-taro-alipay'
]

const OFFICIAL_REGISTRY = 'https://registry.npmjs.org/'

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Running: ${command} ${args.join(' ')} in ${cwd}`)
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command exited with code ${code}`))
      }
    })

    child.on('error', reject)
  })
}

async function getCurrentRegistry() {
  return new Promise((resolve) => {
    let output = ''
    const child = spawn('npm', ['config', 'get', 'registry'], {
      cwd: root,
      shell: true
    })
    child.stdout?.on('data', (data) => {
      output += data.toString()
    })
    child.on('exit', () => {
      resolve(output.trim())
    })
  })
}

async function setRegistry(registry) {
  await runCommand('npm', ['config', 'set', 'registry', registry], root)
}

async function publishPackage(pkgName) {
  const pkgDir = path.join(releaseRoot, pkgName)
  console.log(`\n🚀 Publishing ${pkgName}...`)
  
  await runCommand('npm', ['publish', '--registry', OFFICIAL_REGISTRY], pkgDir)
  console.log(`✅ ${pkgName} published successfully!`)
}

async function main() {
  console.log('='.repeat(60))
  console.log('Tracker SDK 发布工具')
  console.log('='.repeat(60))
  
  // 保存当前 registry
  const originalRegistry = await getCurrentRegistry()
  console.log(`\n📌 Current registry: ${originalRegistry}`)
  
  // 先检查是否已登录官方源
  try {
    console.log('\n📋 Checking npm login status on official registry...')
    await runCommand('npm', ['whoami', '--registry', OFFICIAL_REGISTRY], root)
    console.log('✅ Logged in to npm official registry')
  } catch (err) {
    console.error('\n❌ Not logged in to npm official registry.')
    console.error('Please run the following command to login:')
    console.error(`\n  npm login --registry=${OFFICIAL_REGISTRY}\n`)
    process.exit(1)
  }
  
  // 确认发布
  console.log('\n⚠️  即将发布以下包到 npm 官方源：')
  packages.forEach(pkg => console.log(`  - ${pkg}`))
  console.log('\n按 Ctrl+C 取消，或等待 5 秒继续...')
  
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // 逐个发布
  for (const pkg of packages) {
    try {
      await publishPackage(pkg)
    } catch (err) {
      console.error(`❌ Failed to publish ${pkg}:`, err.message)
      console.error('停止发布')
      process.exit(1)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 All packages published successfully!')
  console.log('='.repeat(60))
}

main().catch(err => {
  console.error('\n❌ Publish failed:', err)
  process.exit(1)
})
