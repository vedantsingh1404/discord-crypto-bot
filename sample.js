//jshint esversion : 8

const meta = require('./meta.json');

var string = 'yo symbol us dollar';

var args = string.split(' ');

var arr_name = args.slice(2,);

var name = arr_name.join(' ');

console.log(name);

const index = meta.findIndex((metadata, index) => {
  return metadata.name.toLowerCase() === name.toLowerCase();
});

console.log(index);
