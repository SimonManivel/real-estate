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
//average price per m2 retrieved from meilleursagents.com
var avgpricem2 = "";
var averagePricePerm2 = 0;


// Json schema
var propertyData = {
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
};

function callLeBonCoin() {
    request( 'https://www.leboncoin.fr/ventes_immobilieres/1087302673.htm?ca=12_s', function ( error, response, body ) {
        if ( !error && response.statusCode == 200 ) {

            var $ = cheerio.load( body );

            // Retrieving the property's price
            $( 'h2.item_price.clearfix' ).each( function ( i, element ) {
                propertyData.properties.price = $( this ).attr( 'content' );
                propertyData.properties.price = parseInt( propertyData.properties.price );
            });

            // Retrieving the property's city and postalCode
            $( 'div.line.line_city span.value' ).each( function ( i, element ) {
                propertyData.properties.city = $( this ).text().split( ' ' )[0];
                propertyData.properties.postalCode = $( this ).text().split( ' ' )[1];
            });

            // Retrieving the property's surface           
            $( 'h2.clearfix span.property' ).each( function ( i, element ) {
                var a = $( this );
                if ( a.text() == "Surface" ) {
                    propertyData.properties.surface = a.next().text()
                    propertyData.properties.surface = parseInt( propertyData.properties.surface );
                }
            });

            // Retrieving the property's type  
            $( 'h2.clearfix span.property' ).each( function ( i, element ) {
                var a = $( this );
                if ( a.text() == "Type de bien" ) {
                    propertyData.properties.type = a.next().text().toString();
                }
            });

            // Calculating the property's priceM (price per m2)
            propertyData.properties.priceM = propertyData.properties.price / propertyData.properties.surface;
            // Rounding the value
            propertyData.properties.priceM = parseInt( propertyData.properties.priceM );
        }
    })
}


function callMeilleursAgents( city, postalCode, type, priceM ) {
    request( "https://www.meilleursagents.com/prix-immobilier/" + city.toLowerCase() + "-" + postalCode.trim() + "/", function ( error, response, body ) {
        if ( !error && response.statusCode == 200 ) {

            var $ = cheerio.load( body );

            $( 'div.small-12.medium-6.columns.prices-summary__cell--row-header' ).each( function ( i, element ) {

                var a = $( this );

                if ( type == "Appartement" ) {
                    avgpricem2 = a.next().next().text().split( '€' )[0].trim().substring( 0, 1 ) + a.next().next().text().split( '€' )[0].trim().substring( 2, 5 );
                    averagePricePerm2 = parseInt( avgpricem2 )
                }

                if ( type == "Maison" ) {
                    avgpricem2 = a.next().next().text().split( '€' )[1].trim().substring( 0, 1 ) + a.next().next().text().split( '€' )[1].trim().substring( 2, 5 );
                    averagePricePerm2 = parseInt( avgpricem2 )
                }
            });
        }
    })
    // Comparing this priceM with price per m2 from meilleursagents.com (which we have to retrieve like we did on leboncoin)
    // Good deal if priceM < price per m2
    if ( averagePricePerm2 > priceM )
        deal = "This is a good deal, the price for this housing is lower than this city's average housing price";
    if ( averagePricePerm2 < priceM )
        deal = "This is not a good deal, the price for this housing is higher than this city's average housing price";
}


app.get( '/', function ( req, res ) {
    // Requests
    callLeBonCoin();
    callMeilleursAgents( propertyData.properties.city, propertyData.properties.postalCode, propertyData.properties.type, propertyData.properties.priceM );

    // Displaying results on localhost:3000
    // Responses
    res.render( 'home', {
        RealEstateAdPrice: propertyData.properties.price,
        RealEstateAdSurface: propertyData.properties.surface,
        RealEstateAdPricePerM2: propertyData.properties.priceM,
        RealEstateAdType: propertyData.properties.type,
        RealEstateAdCity: propertyData.properties.city,
        RealEstateAdPcode: propertyData.properties.postalCode,
        CityAveragePricePerm2: averagePricePerm2,
        messageDeal: deal
    })
})


//launch the server on the 3000 port
app.listen( 3000, function () {
    console.log( 'App listening on port 3000!' );
});