var Swift = require('./lib/swift');
var swift = new Swift(
     'vcc2:vcc2'
  ,  'vcc2'
  ,  'vcc2node2'
  ,  9000
)

swift.createObject('wav', '1.wav', 'http://vcc2node2/fsresources/1.wav').then(()=>{
    console.log('done');
}).catch((e)=>{
    console.log(e.status, e.message);
})

/*swift.createObject('wav', '1.wav', './1.wav').catch((e)=>{
    console.log(e.status, e.message);
})*/