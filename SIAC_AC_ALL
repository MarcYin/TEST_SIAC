// A sensor invariant Atmospheric Correction (SIAC) GEE version
// v1 -- 2019-05-06
// Author: Fengn Yin, UCL
// Email: ucfafy@ucl.ac.uk
// Github: https://github.com/MarcYin/SIAC
// DOI: https://eartharxiv.org/ps957/
// LICENSE: GNU GENERAL PUBLIC LICENSE V3
var s2_cloud = require('./S2_cloud')
var Sen2Cloud = require('./Sen2Cloud')
var inverse_6S_AOT = require('./Inverse_6S_AOT_brdf')
var inverse_S2_TCWV = require('./Inverse_S2_TCWV')
var kernel = require('./get_kernel')
var interp_mcd43a1 = require('./interp_MCD43A1')
var tnn = require('./Two_NN')
var s2b_ac = require('./S2B_AC')
var siac_processor = require('./AC_processor')
var siac = function(image){
  image     = ee.Image(image)
  var geom  = image.geometry()
  var image_date = image.date()
  var projection = image.select('B2').projection()
  var crs = projection.crs()
  var boa = siac_processor.get_boa(image)
  var aot   = boa.select('AOT')
  var tcwv  = boa.select('WVP')
  var tco3  = boa.select('TCO3')
  var cloud = boa.select('MSK_CLDPRB')
  var name     = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A',  'B11', 'B12']
  var new_name = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B8A',  'B11', 'B12']
  var boa = boa.select(name, new_name).multiply(10000).toInt()
  var fname = ee.String(image.get('PRODUCT_ID')).getInfo() 
}

// var s2_file = '20190303T184259_20190303T184825_T10SGF'
// var s2_file = '20180115T030049_20180115T030132_T50SND'
// var image = ee.ImageCollection('COPERNICUS/S2').filterMetadata('system:index', 'equals', s2_file)
//                       .first()
// var id = 'S2A_MSIL1C_20190227T030651_N0207_R075_T50SMG_20190227T074020'
// var image = ee.ImageCollection('COPERNICUS/S2').filterMetadata('PRODUCT_ID', 'equals', id)

exports.siac = siac

