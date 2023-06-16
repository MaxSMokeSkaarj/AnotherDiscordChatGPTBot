const fs = require( 'fs' );
let MessageHistory = JSON.parse( fs.readFileSync( './json/history.json' ).toString() );
MessageHistory.unshift(
    {
        "role": "user",
        "message": "message1",
        "name": "Name1"
    }
);
fs.writeFileSync( './json/history.json', JSON.stringify( MessageHistory, '\n', 4 ) );
