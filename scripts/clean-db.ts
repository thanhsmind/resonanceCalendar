import { openDatabases, closeDatabases } from '@/store/db'
import { readEnv } from '@/env'
import { run } from '@/store/query'

openDatabases(readEnv().dataDir)
run("delete from posts")
run("delete from post_terms")
console.log("Cleared all posts and terms from SQLite DB")
closeDatabases()
