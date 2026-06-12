#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const versionPath = path.join(root, 'version.json')

async function getCurrentVersion() {
  try {
    const data = await readFile(versionPath, 'utf8')
    const { version } = JSON.parse(data)
    return version
  } catch {
    return '0.1.0'
  }
}

async function saveVersion(version) {
  await writeFile(versionPath, JSON.stringify({ version }, null, 2), 'utf8')
}

function incrementVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number)
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`
  }
}

async function main() {
  const type = process.argv[2] || 'patch'
  const validTypes = ['major', 'minor', 'patch']
  
  if (!validTypes.includes(type)) {
    console.error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`)
    process.exit(1)
  }
  
  const currentVersion = await getCurrentVersion()
  const newVersion = incrementVersion(currentVersion, type)
  
  await saveVersion(newVersion)
  console.log(`Version bumped from ${currentVersion} to ${newVersion}`)
  return newVersion
}

main().catch((err) => {
  console.error('Failed to bump version:', err)
  process.exit(1)
})
