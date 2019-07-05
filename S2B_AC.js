// A sensor invariant Atmospheric Correction (SIAC) GEE version
// v1 -- 2019-05-06
// Author: Fengn Yin, UCL
// Email: ucfafy@ucl.ac.uk
// Github: https://github.com/MarcYin/SIAC
// DOI: https://eartharxiv.org/ps957/
// LICENSE: GNU GENERAL PUBLIC LICENSE V3
var tnn = require('./Two_NN')
var S2_offsets = require('./S2_RAD_Offsets')
var S2_scales  = require('./S2_RAD_Scales')
var bands = ee.List(['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B8A',  'B11', 'B12'])

var predict = function(image, H1_scale, H1_offset, H2_scale, H2_offset, Out_scales, Out_offsets){
  var arrayImage1D = image.toArray()
  var arrayImage2D = arrayImage1D.toArray(1);
  var imageAxis = 0;
  var bandAxis  = 1;
  var arrayLength = arrayImage2D.arrayLength(imageAxis);
  arrayImage2D    = arrayImage2D
  var h1  = arrayImage2D.arrayTranspose().matrixMultiply(ee.Image(ee.Array(H1_scale))).add(ee.Image(ee.Array(H1_offset)).toArray(1).arrayTranspose())
  var in1 = h1.max(0)
  var h2  = in1.matrixMultiply(ee.Image(ee.Array(H2_scale))).add(ee.Image(ee.Array(H2_offset)).toArray(1).arrayTranspose())
  var in2 = h2.max(0)
  var out_scale_offsets = Out_scales.zip(Out_offsets)
  var get_out = function(out_scale_offset){
    var Out_scale  = ee.List(out_scale_offset).get(0)
    var Out_offset = ee.List(out_scale_offset).get(1)
    var oup = in2.matrixMultiply(ee.Image(ee.Array(Out_scale)).toArray(1))
    var out = oup.arrayProject([0]).arrayFlatten([['xx']]).add(ee.Image(ee.Number(ee.List(Out_offset).get(0))))
    return out
  }
  var ret = out_scale_offsets.map(get_out)
  return ret
}

var S2B_B01_AC = function(control, image){
  var i=0
  var xap = predict(control, S2_scales.S2B_xap_H1_scale,  S2_offsets.S2B_xap_H1_offset, 
                             S2_scales.S2B_xap_H2_scale,  S2_offsets.S2B_xap_H2_offset, 
                             S2_scales.S2B_xap_Out_scale, S2_offsets.S2B_xap_Out_offset)
                             
  var xbp = predict(control, S2_scales.S2B_xbp_H1_scale,  S2_offsets.S2B_xbp_H1_offset, 
                             S2_scales.S2B_xbp_H2_scale,  S2_offsets.S2B_xbp_H2_offset, 
                             S2_scales.S2B_xbp_Out_scale, S2_offsets.S2B_xbp_Out_offset)
 
  var xcp = predict(control, S2_scales.S2B_xcp_H1_scale,  S2_offsets.S2B_xcp_H1_offset, 
                             S2_scales.S2B_xcp_H2_scale,  S2_offsets.S2B_xcp_H2_offset, 
                             S2_scales.S2B_xcp_Out_scale, S2_offsets.S2B_xcp_Out_offset)
  
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}

var S2B_B02_AC = function(control, image){
  var i=1
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B03_AC = function(control, image){
  var i=2
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B04_AC = function(control, image){
  var i=3
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B05_AC = function(control, image){
  var i=4
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B06_AC = function(control, image){
  var i=5
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B07_AC = function(control, image){
  var i=6
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B08_AC = function(control, image){
  var i=7
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B8A_AC = function(control, image){
  var i=8
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B09_AC = function(control, image){
  var i=9
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B10_AC = function(control, image){
  var i=10
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B11_AC = function(control, image){
  var i=11
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var S2B_B12_AC = function(control, image){
  var i=12
  var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
                                S2_offsets.S2B_xap_H1_offset.get(i),
                                S2_scales.S2B_xap_H2_scale.get(i),
                                S2_offsets.S2B_xap_H2_offset.get(i),
                                S2_scales.S2B_xap_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xap_Out_offset.get(i)).get(0))

  var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
                                S2_offsets.S2B_xbp_H1_offset.get(i),
                                S2_scales.S2B_xbp_H2_scale.get(i),
                                S2_offsets.S2B_xbp_H2_offset.get(i),
                                S2_scales.S2B_xbp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xbp_Out_offset.get(i)).get(0))
                              
  var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
                                S2_offsets.S2B_xcp_H1_offset.get(i),
                                S2_scales.S2B_xcp_H2_scale.get(i),
                                S2_offsets.S2B_xcp_H2_offset.get(i),
                                S2_scales.S2B_xcp_Out_scale.get(i),
                                ee.List(S2_offsets.S2B_xcp_Out_offset.get(i)).get(0))
                                
  var y = image.select([bands.get(i)]).multiply(xap).subtract(xbp); 
  var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename([bands.get(i)])
  return boa
}


var SIAC_S2B_10m = function(control_vars, image){
  var B01 = S2B_B01_AC(control_vars, image)
  var B02 = S2B_B02_AC(control_vars, image)
  var B03 = S2B_B03_AC(control_vars, image)
  var B04 = S2B_B04_AC(control_vars, image)
  var B05 = S2B_B05_AC(control_vars, image)
  var B06 = S2B_B06_AC(control_vars, image)
  var B07 = S2B_B07_AC(control_vars, image)
  var B08 = S2B_B08_AC(control_vars, image)
  var B8A = S2B_B8A_AC(control_vars, image)
  var B09 = S2B_B09_AC(control_vars, image)
  var B10 = S2B_B10_AC(control_vars, image)
  var B11 = S2B_B11_AC(control_vars, image)
  var B12 = S2B_B12_AC(control_vars, image)
  //return ee.Image.cat([[B01, B02, B03, B04, B05, B06, B07, B08, B8A, B09, B10, B11, B12]])
  return ee.Image.cat([B02, B03, B04, B08])
}

var SIAC_S2B_B05_B07_20m = function(control_vars, image){
  var B01 = S2B_B01_AC(control_vars, image)
  var B02 = S2B_B02_AC(control_vars, image)
  var B03 = S2B_B03_AC(control_vars, image)
  var B04 = S2B_B04_AC(control_vars, image)
  var B05 = S2B_B05_AC(control_vars, image)
  var B06 = S2B_B06_AC(control_vars, image)
  var B07 = S2B_B07_AC(control_vars, image)
  var B08 = S2B_B08_AC(control_vars, image)
  var B8A = S2B_B8A_AC(control_vars, image)
  var B09 = S2B_B09_AC(control_vars, image)
  var B10 = S2B_B10_AC(control_vars, image)
  var B11 = S2B_B11_AC(control_vars, image)
  var B12 = S2B_B12_AC(control_vars, image)
  //return ee.Image.cat([[B01, B02, B03, B04, B05, B06, B07, B08, B8A, B09, B10, B11, B12]])
  return ee.Image.cat([B05, B06, B07])
}

var SIAC_S2B_B8A_B12_20m = function(control_vars, image){
  var B01 = S2B_B01_AC(control_vars, image)
  var B02 = S2B_B02_AC(control_vars, image)
  var B03 = S2B_B03_AC(control_vars, image)
  var B04 = S2B_B04_AC(control_vars, image)
  var B05 = S2B_B05_AC(control_vars, image)
  var B06 = S2B_B06_AC(control_vars, image)
  var B07 = S2B_B07_AC(control_vars, image)
  var B08 = S2B_B08_AC(control_vars, image)
  var B8A = S2B_B8A_AC(control_vars, image)
  var B09 = S2B_B09_AC(control_vars, image)
  var B10 = S2B_B10_AC(control_vars, image)
  var B11 = S2B_B11_AC(control_vars, image)
  var B12 = S2B_B12_AC(control_vars, image)
  //return ee.Image.cat([[B01, B02, B03, B04, B05, B06, B07, B08, B8A, B09, B10, B11, B12]])
  return ee.Image.cat([B8A, B11, B12])
}

var SIAC_S2B_60m = function(control_vars, image){
  var B01 = S2B_B01_AC(control_vars, image)
  var B02 = S2B_B02_AC(control_vars, image)
  var B03 = S2B_B03_AC(control_vars, image)
  var B04 = S2B_B04_AC(control_vars, image)
  var B05 = S2B_B05_AC(control_vars, image)
  var B06 = S2B_B06_AC(control_vars, image)
  var B07 = S2B_B07_AC(control_vars, image)
  var B08 = S2B_B08_AC(control_vars, image)
  var B8A = S2B_B8A_AC(control_vars, image)
  var B09 = S2B_B09_AC(control_vars, image)
  var B10 = S2B_B10_AC(control_vars, image)
  var B11 = S2B_B11_AC(control_vars, image)
  var B12 = S2B_B12_AC(control_vars, image)
  //return ee.Image.cat([[B01, B02, B03, B04, B05, B06, B07, B08, B8A, B09, B10, B11, B12]])
  return ee.Image.cat([B01, B09, B10])
}

var S2B_AC = function(control, image){
  var xap = predict(control, S2_scales.S2B_xap_H1_scale,  S2_offsets.S2B_xap_H1_offset, 
                             S2_scales.S2B_xap_H2_scale,  S2_offsets.S2B_xap_H2_offset, 
                             S2_scales.S2B_xap_Out_scale, S2_offsets.S2B_xap_Out_offset)
                             
  var xbp = predict(control, S2_scales.S2B_xbp_H1_scale,  S2_offsets.S2B_xbp_H1_offset, 
                             S2_scales.S2B_xbp_H2_scale,  S2_offsets.S2B_xbp_H2_offset, 
                             S2_scales.S2B_xbp_Out_scale, S2_offsets.S2B_xbp_Out_offset)
 
  var xcp = predict(control, S2_scales.S2B_xcp_H1_scale,  S2_offsets.S2B_xcp_H1_offset, 
                             S2_scales.S2B_xcp_H2_scale,  S2_offsets.S2B_xcp_H2_offset, 
                             S2_scales.S2B_xcp_Out_scale, S2_offsets.S2B_xcp_Out_offset)
  var ret   = [];
  var i;
  for (i=0; i<11; i++){
    var y = image.select([bands.get(i)]).multiply(ee.Image(xap.get(i))).subtract(ee.Image(xbp.get(i)));
    var boa = y.divide(ee.Image(xcp.get(i)).multiply(y).add(ee.Image(1))).rename([bands.get(i)])
    ret.push(boa)
  }
  return ee.Image.cat(ret)
}


// var SIAC_S2B = function(control, image){
//   var i;
//   var ret   = [];
//   for (i=0; i<13; i++){
//     var xap = tnn.predict(control,S2_scales.S2B_xap_H1_scale.get(i),
//                                   0,
//                                   S2_scales.S2B_xap_H2_scale.get(i),
//                                   0,
//                                   S2_scales.S2B_xap_Out_scale.get(i),
//                                   0)
  
//     var xbp = tnn.predict(control,S2_scales.S2B_xbp_H1_scale.get(i),
//                                   0,
//                                   S2_scales.S2B_xbp_H2_scale.get(i),
//                                   0,
//                                   S2_scales.S2B_xbp_Out_scale.get(i),
//                                   0)
                                
//     var xcp = tnn.predict(control,S2_scales.S2B_xcp_H1_scale.get(i),
//                                   0,
//                                   S2_scales.S2B_xcp_H2_scale.get(i),
//                                   0,
//                                   S2_scales.S2B_xcp_Out_scale.get(i),
//                                   0)
                                  
//   var y = image.select(bands.get(i)).multiply(xap).subtract(xbp); 
//   var boa = y.divide(xcp.multiply(y).add(ee.Image(1))).rename(bands.get(i))
//   ret.push(boa)
//   }
//   return ee.Image.cat(ret)
// }

exports.SIAC_S2B_10m   = SIAC_S2B_10m
exports.SIAC_S2B_60m   = SIAC_S2B_60m
exports.SIAC_S2B_B05_B07_20m   = SIAC_S2B_B05_B07_20m
exports.SIAC_S2B_B8A_B12_20m   = SIAC_S2B_B8A_B12_20m


exports.S2B_AC = S2B_AC



