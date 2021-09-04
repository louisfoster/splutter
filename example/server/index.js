const express = require( `express` )
const multer = require( `multer` )
const fs = require( `fs` )
const path = require( `path` )
const os = require( 'os' )

const PORT = 5557
const home = os.homedir()
const baseDir = path.join( home, `.splutter` )
const exampleDir = path.join( baseDir, `example-${ Date.now() }` )

console.log("Saving to dir", exampleDir)

makeIfNotExists( baseDir )

makeIfNotExists( exampleDir )

let count = 0

var storage = multer.diskStorage( {
	destination: (req, file, cb) =>
	{
		cb(null, exampleDir)
	},
	filename: (req, file, cb) => 
	{
		count++

		const fileName = `${count.toString().padStart(7, `0`)}.opus`  

		console.log("Saving file", fileName)

		cb(null, fileName)
	}
} )

const upload = multer( { storage: storage } )

const app = express()

app.use(express.static('example'))

app.use('/build', express.static('build'))

app.post( `/uploadAudio`, upload.single( `audio` ), ( req, res ) => 
{
	res.json("success")
} )

console.log("Listening on PORT", PORT)

app.listen( PORT )

function makeIfNotExists( dir )
{
	if ( !fs.existsSync( dir ) )
	{
		fs.mkdirSync( dir )
	}
}