# geo-inset
tests to generate inset graphics with d3

```
node main.js "damascus" fw -s -p -w 300 -h 200
```
searches for damascus, generates a map based on that location in svg as well as png format using "fw" as the output file base, and resizes the png to 300 x 200
![Example Image](https://github.com/chrisbennight/geo-inset/blob/master/fw.png)

for more info

```
$ node main.js --help

  Usage: main [options] <city> <outputfile>
  Options:
    -h, --help                output usage information
    -V, --version             output the version number
    -p, --png                 Output png format
    -s, --svg                 Output svg format
    -w, --pngwidth [width]    PNG Width
    -h, --pngheight [height]  PNG Height
```
