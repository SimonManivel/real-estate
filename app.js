//importing modules
var express = require( 'express' );
var request = require( 'request' );
var cheerio = require( 'cheerio' );

//creating a new express server
var app = express();

//setting EJS as the templating engine
app.set( 'view engine', 'ejs' );

//setting the 'assets' directory as our static assets dir (css, js, img, etc...)
app.use( '/assets', express.static( 'assets' ) );

//string variable that indicates wether the deal is good or not
var deal = "";

// Json schema
var propertyData = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "Real Estate LeBonCoin Ad",
    "type": "object",
    "properties": {
        "price": 0,
        "surface": 0,
        "city": "",
        "type": "",
        "postalCode": "",
        "priceM": 0
    },
    "required": ["price", "surface"]
};


app.get( '/', function ( req, res ) {
    request( 'https://www.leboncoin.fr/ventes_immobilieres/1087302673.htm?ca=12_s', function ( error, response, body ) {
        if ( !error && response.statusCode == 200 ) {

            var $ = cheerio.load( body );

            /* Retrieving the property's price
            $( 'h2.item_price.clearfix span.value' ).each( function ( i, element ) {
                var a = $( this );
                propertyData.properties.price = a.text();
                propertyData.properties.price = parseInt( Remplace( Remplace( propertyData.properties.price, "€", "" ), " ", "" ) );
            });*/

            // Retrieving the property's price
            $( 'h2.item_price.clearfix' ).each( function ( i, element ) {
                var a = $( this ).attr( 'content' );
                propertyData.properties.price = a;
                propertyData.properties.price = parseInt( Remplace( Remplace( propertyData.properties.price, "€", "" ), " ", "" ) );
            });

            // Retrieving the property's surface            
            $( 'h2.clearfix span.property' ).each( function ( i, element ) {
                var a = $( this );
                // check and change surface value when "Surface" is found in html
                if ( a.text() == "Surface" ) {
                    propertyData.properties.surface = a.next().text()
                    propertyData.properties.surface = parseInt( Remplace( info.surface, " m2", "" ) );
                }
            });

            // Retrieving the property's type  
            $( 'h2.clearfix span.property' ).each( function ( i, element ) {
                var a = $( this );
                if ( a.text() == "Type de bien" ) {
                    propertyData.properties.type = a.next().text()
                }
            });

            // Retrieving the property's city and postalCode 
            $( 'div.line.line_city span.value' ).each( function ( i, element ) {
                var a = $( this );
                // City and postalCode are in the same string but separated by a ' '
                propertyData.properties.city = a.text().split( ' ' )[0];
                propertyData.properties.postalCode = a.text().split( ' ' )[1];
            });

            // Calculating the property's priceM (price per m2)
            propertyData.properties.priceM = propertyData.properties.price / propertyData.properties.surface;

            console.log( body )
        }
        res.send( body )
    })
});

var averagePricePerm2 = 0;
var lienMeilleursAgents = "https://www.meilleursagents.com/prix-immobilier/" + propertyData.properties.city.toLowerCase() + "-" + propertyData.properties.postalCode + "/";
app.get( '/', function ( req, res ) {
    request( lienMeilleursAgents, function ( error, response, body ) {
        if ( !error && response.statusCode == 200 ) {

            var $ = cheerio.load( body );
            $( 'div.small-12.medium-6.columns.prices-summary__cell--row-header' ).each( function ( i, element ) {

                var a = $( this );

                // If the ad was about an apartment                
                if ( propertyData.properties.type == "Appartement" ) {
                    if ( a.children()[0].next.data == "Prix m2 appartement" ) {
                        averagePricePerm2 = a.next().next().text();
                    }
                }

                // If the ad was about a house
                if ( propertyData.properties.type == "Maison" ) {
                    if ( a.children()[0].next.data == "Prix m2 maison" ) {
                        averagePricePerm2 = a.next().next().text();
                    }
                }
            });
        }
    })
    // Comparing this priceM with price per m2 from meilleursagents.com (which we have to retrieve like we did on leboncoin)
    // Good deal if priceM < price per m2
    If( averagePricePerm2 > propertyData.properties.priceM )
    deal = "This is a good deal, the price for this housing is lower than this city's average housing price";
    If( averagePricePerm2 < propertyData.properties.priceM )
    deal = "This is not a good deal, the price for this housing is higher than this city's average housing price";
});


//launch the server on the 3000 port
app.listen( 3000, function () {
    console.log( 'App listening on port 3000!' );
    console.log( propertyData.properties.price );
});