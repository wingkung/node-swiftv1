var Swift = require('./lib/swift');
var swift = new Swift(
     'vcc2:vcc2'
  ,  'vcc2'
  ,  'vcc2node2'
  ,  9000
)

swift.createObject('4_vm', '161026_1477412360105.wav', 'http://vcc2node2/fsresources/4/vm/161026/1477412360105.wav').catch((e)=>{
    console.log(e.stack);
})

/*swift.createObject('4_vm', 'README.md', './README.md').catch((e)=>{
    console.log(e.stack);
})*/