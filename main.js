#!/usr/bin/env node
var program = require('commander');
var placename = require('placename');
var graphic = require('./geo/graphic.js');
var fs = require('fs');
var svg2png = require("svg2png");
var sharp = require("sharp");



city = null;
outfile = null;

program
    .version('0.0.1')
    .usage('[options] <city> <outputfile>')
    .option('-p, --png', 'Output png format')
    .option('-s, --svg', 'Output svg format')
    .option('-w, --pngwidth [width]', 'PNG Width')
    .option('-h, --pngheight [height]', 'PNG Height')
    .arguments('<city> <outputfile>')
    .action(function(c, o) {
        city = c;
        outfile = o;
    })
    .parse(process.argv);


if (city === null || outfile === null){
    console.log("Missing city or outputfile")
    program.help();
} else if (program.png == null && program.svg == null){
    console.log("Must specify svg, png, or both as the output format")
    program.help();

} else {
    placename(city, function (err, rows){
       if (rows.length == 0){
           console.log("No matches found for: " + city);
       } else {
           console.log("Matching on: " + rows[0].name + " for input value: " + city);


           var svg =  graphic(rows[0].name, rows[0].lon, rows[0].lat, 800, 600);

           svgFilename =  outfile + ".svg";
           fs.writeFileSync(svgFilename, svg);

           if (program.png){
               pngFilename = outfile + ".png";
               var input = fs.readFileSync(svgFilename);
               console.log("W:" + program.pngwidth + " H: " + program.pngheight);
               var output = svg2png.sync(input);
               fs.writeFileSync(pngFilename, output);
               if (program.pngwidth != null && program.pngheight != null) {
                   sharp(pngFilename)
                       .resize(Number(program.pngwidth), Number(program.pngheight))
                       .toFile(outfile + "_resized.png", function(err){
                            if (err){throw err;}
                   });
               }
               console.log("Wrote " + pngFilename);
           }

           if (program.svg) {
               console.log("Wrote " + svgFilename);
           } else {
               fs.unlinkSync(svgFilename);
           }

       }
    });
}