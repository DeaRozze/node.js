const yargs = require('yargs')
const path = require('path')
const fs = require('fs')

require('dotenv').config()

const args = yargs
    .usage('Usage: node $0 [options]')
    .version('0.0.1')
    .alias('version', 'v')
    .help('help')
    .alias('help', 'h')
    .example('node $0 --entry ./path --dist ./path --delete')
    .option('entry', {
        alias: 'e',
        describe: 'Указать путь к исходной диретории',
        demandOption: true
    })
    .option('dist', {
        alias: 'd',
        describe: 'Указать путь к dist директории',
        default: './dist'
    })
    .option('delete', {
        alias: 'D',
        describe: 'Удалять ли исходную папку',
        boolean: true,
        default: false
    })
    .epilog('Моя первая домашка')
    .argv

const config = {
    entry: path.normalize(path.join(__dirname, args.entry)),
    dist: path.normalize(path.join(__dirname, args.dist)),
    delete: args.delete
}

console.log(process.env.PORT)

/////////////////////////////////// 1 часть callback

// function creteDir(src, callback) {
//     fs.mkdir(src, (err) => {
//         if (err && err.code === 'EEXIST') {
//             callback(null)
//         } else if (err) {
//             callback(err)
//         } else {
//             callback(null)
//         }
//     })
// }

// function sorter(src) {
//     fs.readdir(src, (err, files) => {
//         if (err) throw err

//         files.forEach((file) => {
//             const currentPath = path.join(src, file)

//             fs.stat(currentPath, (err, stat) => {
//                 if (err) throw err

//                 if (stat.isDirectory()) {
//                     sorter(currentPath)
//                 } else {
//                     creteDir(config.dist, (err) => {
//                         if (err) throw err

//                         const folderName = path.join(config.dist, file[0].toUpperCase())

//                         creteDir(folderName, (err) => {
//                             if (err) throw err

//                             const resFile = path.join(folderName,file) 
//                             fs.link(currentPath,resFile,err => {
//                                 if(err) throw err
//                             })  
//                         })
//                     })
//                 }
//             })
//         })

//     })
// }
// try {
//     sorter(config.entry)
//     console.log('done!!')
// } catch (error) {
//     console.log(error)
// }

/////////////////////////////////// 2часть promise
function copyFile(currentPath, resFile) {
    return new Promise((resolve, reject) => {
        fs.link(currentPath, resFile, (err) => {
            if (err) reject(err)

            resolve()
        })
    })
}


function creteDir(src) {
    return new Promise((resolve, reject) => {
        fs.mkdir(src, (err) => {
            if (err && err.code === 'EEXIST') {
                resolve()
            } else if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function readdir(src) {
    return new Promise((resolve, reject) => {
        fs.readdir(src, (err, files) => {
            if (err) reject(err)

            resolve(files)
        })
    })
}

function isDirectory(src) {
    return new Promise((resolve, reject) => {
        fs.stat(src, (err, stat) => {
            if (err) reject(err)

            if (stat.isDirectory()) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

async function sorter(src) {
    const files = await readdir(src)

    for (const file of files) {
        const currentPath = path.join(src, file)
        const isDir = await isDirectory(currentPath)

        if (isDir) {
            await sorter(currentPath)
        } else {
            await creteDir(config.dist)
            const folderName = path.join(config.dist, file[0].toUpperCase())
            await creteDir(folderName)
            const resFile = path.join(folderName, file)
            await copyFile(currentPath, resFile)
        }
    }
}

(async () => {
    try {
        await sorter(config.entry)

        if (config.delete) {
            console.log('delete')
        }
    } catch (error) {
        console.log(error)
    }
})()