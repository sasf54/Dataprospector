# Dataprospector Jquery / bootstrap plugin
This is a jquery / bootstrap plugin that allows for the users to quickly and easily find the desired
records in a large dataset. The users can setup complex filter combinations to filter out not fitting data.
users can order the displayed data by any visible column or filter.
It supports complex filtering (mathematical algorithms that are supported in javascript).
It tries to find out the type of each column, and creates the appropriate filter for it.
It can be used with about 10 lines of code, mostly javascript import.
All the filtering and processing is done in the browser at client side. It is still quite fast and handy.
Please take some time to try it, and play with it a bit.

## Demo
Please, download the project, and try it with any of the html files, trough [github's raw view](https://raw.githubusercontent.com/sasf54/Dataprospector/master/index.html) or go to the [project homepage](https://dataprospector.net).

## Installing
Include the the dependency javascripts, the CSSs, and the Dataprospector, and call it on the object you want to use.
```js
$('div#myDiv').dataprospector({data:dataToDisplay});
```
or
```js
$('table#myTable').dataprospector();
```
For more example you can look at the features.html.

## Documentation
For available options, please see documentation.html, or the source code.

## License 

CC BY-SA
https://creativecommons.org/licenses/by-sa/4.0/
https://creativecommons.org/licenses/by-sa/4.0/legalcode

> Extension: By using this code, you are agreeing, that you allowing the contributors free use of any
> product / service it's used in.

## Dependency files
There are all the dependency sourced here too.
There are two reasons for that:
* I'm sure, that it was working with those, and with those versions
* It will make sure, that the demo and the html examples / tutorials will work

Please feel free, to ignore if you already included a version of them, or replace those with higher versions.
