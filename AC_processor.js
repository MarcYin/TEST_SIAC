// A sensor invariant Atmospheric Correction (SIAC) GEE version
// v1 -- 2019-05-06
// Author: Fengn Yin, UCL
// Email: ucfafy@ucl.ac.uk
// Github: https://github.com/MarcYin/SIAC
// DOI: https://eartharxiv.org/ps957/
// LICENSE: GNU GENERAL PUBLIC LICENSE V3
//var s2_cloud = require('./S2_cloud')
var Sen2Cloud = require('./Sen2Cloud')
var inverse_6S_AOT = require('./Inverse_6S_AOT_brdf')
var inverse_S2_TCWV = require('./Inverse_S2_TCWV')
var kernel = require('./get_kernel')
var interp_mcd43a1 = require('./interp_MCD43A1')
var tnn = require('./Two_NN')
var s2b_ac = require('./S2B_AC')
var mcd43_names  = kernel.mcd43_names
var s2_bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'B10', 'B8A', 'B7']
var l8_bands = ['B2', 'B3', 'B4', 'B5', 'B6',  'B7',  'B9',  'B10', 'B8']
var common_bands = ['BLUE', 'GREEN', 'RED', 'NIR', 'SWIR1', 'SWIR2', 'CIRRUS', 'EB1', 'EB2'] 

var get_boa = function(image){
  image     = ee.Image(image)
  var geom  = image.geometry()
  var image_date = image.date()
  var projection = image.select('B2').projection()
  var crs = projection.crs()
  var image2 = ee.Image(image.divide(10000))
  var orig_image = ee.Image(image.select(s2_bands.slice(0,6), common_bands.slice(0,6)).divide(10000)
                                 .copyProperties(image))//
                                 .set('system:time_start', image.get('system:time_start'))
  //var img = get_cloud(image)
  //var cloud = ee.Image(img.select('cloud'))
 
  var cloud_bands = ['B1', 'B2', 'B4', 'B5', 'B8', 'B8A', 'B9', 'B10', 'B11', 'B12']
  var control = image.select(cloud_bands).multiply(0.0001).reproject(crs, null, 10)
  var cloud = tnn.predict(control, Sen2Cloud.Sen2Cloud_H1_scale,
                                    Sen2Cloud.Sen2Cloud_H1_offset,
                                    Sen2Cloud.Sen2Cloud_H2_scale,
                                    Sen2Cloud.Sen2Cloud_H2_offset,
                                    Sen2Cloud.Sen2Cloud_Out_scale,
                                    Sen2Cloud.Sen2Cloud_Out_offset).rename('cloud_prob')
  var cloud_prob = ee.Image(1).divide(ee.Image(1).add((ee.Image(-1).multiply(cloud)).exp()))
  var cloud = cloud_prob.gt(0.4).rename('cloud')
  //var shadow = ee.Image(0)
  var dia_cloud  = cloud.focal_max({kernel: ee.Kernel.circle({radius: 60, units:  'meters'})})
  //var dia_shadow = shadow.focal_max({kernel: ee.Kernel.circle({radius: 1500, units:  'meters'})})
  image = ee.Image(image.select(s2_bands.slice(0,6), common_bands.slice(0,6)).divide(10000)
                        .updateMask(dia_cloud.eq(0))
                        .copyProperties(image))//
                        .set('system:time_start', image.get('system:time_start'))
  // var collection = ee.ImageCollection('MODIS/006/MCD43A1')
  //                         .filterDate(image_date, ee.Date(image_date).advance(1, 'day'))
  //                         .filterBounds(geom)
  //                         .select(mcd43_names)
  var mcd43a1    = interp_mcd43a1.interp_mcd43a1(image)
                             
  var psf = ee.Kernel.gaussian({
    radius: 1500,
    sigma: 300,
    units: 'meters',
    normalize: true,
  });
  image = image.convolve(psf)
  var saa  = ee.Image.constant(ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'))).rename('saa')
  var sza  = ee.Image.constant(ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE' ))).rename('sza')
  var vaa  = ee.Image.constant(ee.Number(image.get('MEAN_INCIDENCE_AZIMUTH_ANGLE_B2'))).rename('vaa')
  var vza  = ee.Image.constant(ee.Number(image.get('MEAN_INCIDENCE_ZENITH_ANGLE_B2' ))).rename('vza')
  
  image = image.addBands([saa, sza, vaa, vza]).addBands(mcd43a1.select(mcd43_names.slice(0, 18)))
  image = kernel.makeBRDFKernels(image)
  var cos_raa = image.select('cos_raa')
  var cos_sza = image.select('cos_sza')
  var cos_vza = image.select('cos_vza')
  var tco3 = ee.ImageCollection('TOMS/MERGED')
                    .filterDate(ee.Date(image_date).advance(-3, 'day'), ee.Date(image_date).advance(4, 'day'))
                    .mean()
                    //.first()
                    .select('ozone')
                    .multiply(0.001)
                    .clip(geom)
  var median = tco3.reduceRegion(ee.Reducer.percentile([50]), geom, 3000, null, null, false, 10e13).get('ozone')
  var tco3 = tco3.unmask().where(tco3.mask().eq(0), ee.Number(median))
  // var kernelSize = 800
  // var ker = ee.Kernel.square(kernelSize * 500, "meters")
  // var tco3 =tco3.reduceNeighborhood({reducer: ee.Reducer.mean(), 
  //                                     kernel: ker,
  //                                     inputWeight: 'mask',
  //                                     skipMasked:false,
  //                                     optimization:'boxcar',
  //                                     }).rename('ozone') 
  //                       //.reduceRegion(ee.Reducer.mean(), geom)
  //Map.addLayer(tco3, {min:0.1, max:0.5}) 
  //var tco3  = ee.Image(ee.Number(tco3.get('ozone'))).rename('tco3')
  var elevation = ee.Image('USGS/SRTMGL1_003').select('elevation').multiply(0.001)
    var image3 = ee.Image.cat([(image.select('BLUE').subtract(1.381298790609708504e-02)).divide(1.006170958348520772e+00), 
                               (image.select('GREEN').subtract(0.00190909687075)).divide(1.00087659541449), 
                               mcd43a1.select('BRDF_Albedo_Parameters_Band3_iso'),
                               mcd43a1.select('BRDF_Albedo_Parameters_Band3_vol'),
                               mcd43a1.select('BRDF_Albedo_Parameters_Band3_geo'),
                               mcd43a1.select('BRDF_Albedo_Parameters_Band4_iso'),
                               mcd43a1.select('BRDF_Albedo_Parameters_Band4_vol'),
                               mcd43a1.select('BRDF_Albedo_Parameters_Band4_geo'),
                               cos_sza, cos_vza, cos_raa, tco3.rename('tco3'), elevation.rename('ele')])
                         .reproject(crs, null, 3000).float()
                         .clip(geom).float()
                      
  var boa_diff  = image.select('simu_boa_b5').subtract(image.select('SWIR1')).rename('diff')
  var pp = boa_diff.reduceRegion(ee.Reducer.percentile([15, 50, 85]), geom, 3000, null, null, false, 10e13)
  var diff_min  = ee.Number(pp.get('diff_p15'))
  var diff_max  = ee.Number(pp.get('diff_p85'))
  var stab_mask = (boa_diff.lte(diff_max)).and(boa_diff.gte(diff_min))
  
  var boa_diff  = image.select('simu_boa_b6').subtract(image.select('SWIR2')).rename('diff')
  var pp = boa_diff.reduceRegion(ee.Reducer.percentile([15, 50, 85]), geom, 3000, null, null, false, 10e13)
  var diff_min  = ee.Number(pp.get('diff_p15'))
  var diff_max  = ee.Number(pp.get('diff_p85'))
  var stab_mask = (boa_diff.lte(diff_max)).and(boa_diff.gte(diff_min)).and(stab_mask)
  
  var median = ee.Number(pp.get('diff_p50'))
  var diff_min  = ee.Number(median).subtract(0.02)
  var diff_max  = ee.Number(median).add(0.02)
  var stab_mask = (boa_diff.lte(diff_max)).and(boa_diff.gte(diff_min)).and(boa_diff.abs().lt(0.03))
  
  var BLUE = image3.select('BLUE')
  var pp   = BLUE.reduceRegion(ee.Reducer.percentile([10, 90]), geom, 3000, null, null, false, 10e13)
  var BLUE_min  = ee.Number(pp.get('BLUE_p10'))
  var BLUE_max  = ee.Number(pp.get('BLUE_p90'))
  var BLUE_mask = (image3.select('BLUE').lte(BLUE_max)).and(image3.select('BLUE').gte(BLUE_min))
  var SWIR2 = image.select('SWIR2')//.reproject(crs, null, 500).float()
  var pp = SWIR2.reduceRegion(ee.Reducer.percentile([10, 90]), geom, 3000, null, null, false, 10e13)
  var SWIR_min  = ee.Number(pp.get('SWIR2_p10'))
  var SWIR_max  = ee.Number(pp.get('SWIR2_p90'))
  var SWIR_mask = (SWIR2.lte(SWIR_max)).and(SWIR2.gte(SWIR_min))
  image3 = image3.updateMask(BLUE_mask.and(stab_mask).and(image3.mask()).and(SWIR_mask))
  var aot = tnn.predict(image3, inverse_6S_AOT.Inverse_6S_AOT_brdf_H1_scale,
                                inverse_6S_AOT.Inverse_6S_AOT_brdf_H1_offset,
                                inverse_6S_AOT.Inverse_6S_AOT_brdf_H2_scale,
                                inverse_6S_AOT.Inverse_6S_AOT_brdf_H2_offset,
                                inverse_6S_AOT.Inverse_6S_AOT_brdf_Out_scale,
                                inverse_6S_AOT.Inverse_6S_AOT_brdf_Out_offset).rename('aot')
  
  var valid_pix = aot.mask().reduceRegion({reducer: ee.Reducer.sum(), 
                                              geometry : geom, 
                                              scale : 3000, 
                                              maxPixels:10e13 })
  var prior_aot = ee.ImageCollection('MODIS/006/MOD08_M3')
                  .select('Aerosol_Optical_Depth_Land_Ocean_Mean_Mean')
                  .filter(ee.Filter.date(ee.Date(image_date).advance(-1, 'year'), image_date))
                  .first()
                  .multiply(0.001)
                  .clip(geom)
                  .rename('aot')
 
  aot = ee.Image(ee.Algorithms.If(ee.Number(valid_pix.get('aot')).lt(5), prior_aot, aot))

  var pp = aot.reduceRegion(ee.Reducer.percentile([10, 50, 90]), geom, 3000, null, null, false, 10e13)
  var aot_min  = ee.Number(pp.get('aot_p10')).subtract(0.001) // avoid boundary
  var aot_max  = ee.Number(pp.get('aot_p90')).add(0.001)
  var median   = ee.Number(pp.get('aot_p50'))
  var aot_mask = (aot.lte(aot_max)).and(aot.gte(aot_min))
  aot = aot.updateMask(aot_mask.and(aot.mask()))
  var filled_aot = aot.unmask().where(aot.mask().eq(0), ee.Number(median))
  var kernelSize = 10
  var ker = ee.Kernel.square(kernelSize * 500, "meters")
  aot     = filled_aot.reduceNeighborhood({reducer: ee.Reducer.mean(), 
                                          kernel: ker,
                                          inputWeight: 'mask',
                                          skipMasked:false,
                                          optimization:'boxcar',
                                        }).rename('aot')
  aot = aot.max(0.01)
  // var palettes = require('users/gena/packages:palettes');
  // var palette = palettes.colorbrewer.YlOrRd[9]
  // Map.addLayer(aot, {min:0.13, max:0.4, palette: palette}, 'AOT')
  var control = ee.Image.cat([ image2.select('B9'), 
                               image2.select('B8A'), 
                               cos_sza, cos_vza, cos_raa, aot, tco3, elevation])
                              .updateMask(dia_cloud.eq(0).and(image2.select('B8A').gt(0.12)))//.and(dia_shadow.eq(0))
                              .reproject(crs, null, 3000).float()
                              .float()
  var tcwv = tnn.predict(control,inverse_S2_TCWV.Inverse_S2_TCWV_H1_scale,
                                inverse_S2_TCWV.Inverse_S2_TCWV_H1_offset,
                                inverse_S2_TCWV.Inverse_S2_TCWV_H2_scale,
                                inverse_S2_TCWV.Inverse_S2_TCWV_H2_offset,
                                inverse_S2_TCWV.Inverse_S2_TCWV_Out_scale,
                                inverse_S2_TCWV.Inverse_S2_TCWV_Out_offset).rename('tcwv')
  
  var pp = tcwv.reduceRegion(ee.Reducer.percentile([10, 50, 90]), geom, 3000, null, null, false, 10e13)
  var tcwv_min  = ee.Number(pp.get('tcwv_p10'))
  var tcwv_max  = ee.Number(pp.get('tcwv_p90'))
  var median    = ee.Number(pp.get('tcwv_p50'))
  var tcwv_mask = (tcwv.lte(tcwv_max)).and(tcwv.gte(tcwv_min))
  tcwv = tcwv.updateMask(tcwv_mask.and(tcwv.mask()))
  var filled_tcwv = tcwv.unmask().where(tcwv.mask().eq(0), ee.Number(median))
  var kernelSize = 6
  var ker = ee.Kernel.square(kernelSize * 500, "meters")
  tcwv     = filled_tcwv.reduceNeighborhood({reducer: ee.Reducer.mean(), 
                                          kernel: ker,
                                          inputWeight: 'mask',
                                          skipMasked:false,
                                          optimization:'boxcar',
                                        }).rename('tcwv')
  tcwv = tcwv.max(0.01)
  // var palette = palettes.colorbrewer.YlOrRd[9]
  // Map.addLayer(tcwv, {min:0.5, max:4., palette: palette}, 'TCWV')
  image = orig_image
  var saa  = ee.Image.constant(ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'))).rename('saa')
  var sza  = ee.Image.constant(ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE' ))).rename('sza')
  var vaa  = ee.Image.constant(ee.Number(image.get('MEAN_INCIDENCE_AZIMUTH_ANGLE_B2'))).rename('vaa')
  var vza  = ee.Image.constant(ee.Number(image.get('MEAN_INCIDENCE_ZENITH_ANGLE_B2' ))).rename('vza')
  var raa  = vaa.subtract(saa)
  var deg2rad = ee.Number(Math.PI).divide(ee.Number(180.0))
  var cos_sza = (sza.multiply(deg2rad)).cos()
  var cos_vza = (vza.multiply(deg2rad)).cos()
  var cos_raa = (raa.multiply(deg2rad)).cos()
  var ele = ee.Image('USGS/SRTMGL1_003').select('elevation').multiply(0.001)
  var res = 3000
  var image4 = ee.Image.cat([cos_sza, cos_vza, cos_raa, aot, tcwv, tco3, ele])
                       .reproject(crs, null, res).float()
                       .clip(geom)
  
  var name     = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A',  'B11', 'B12']
  var new_name = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B8A',  'B11', 'B12']
  
  var boa = s2b_ac.S2B_AC(image4, image2.select(name, new_name))
  // Map.addLayer(boa, {bands: ['B04', 'B03', 'B02'], min:0, max:0.2}, 'BOA')
  // Map.addLayer(image2, {bands: ['B4', 'B3', 'B2'], min:0, max:0.2}, 'TOA')
  // Map.addLayer(image4)
  // Map.centerObject(image4)
  return ee.Image(boa.select(new_name, name))
                .addBands([aot.rename('AOT'), 
                          tcwv.rename('WVP'), 
                          cloud.rename('MSK_CLDPRB'),
                          tco3.rename('TCO3')])

}
// var s2_file = '20190127T034021_20190127T034019_T47PPR'
// var image = ee.ImageCollection('COPERNICUS/S2').filterMetadata('system:index', 'equals', s2_file)
//                       .first()
// print(image)
// print(get_boa(image))

var id = 'S2A_MSIL1C_20170607T030541_N0205_R075_T50SLG_20170607T031648'
var image = ee.ImageCollection('COPERNICUS/S2').filterMetadata('PRODUCT_ID', 'equals', id).first()
var region = JSON.stringify(image.select(0).geometry().bounds().getInfo())
print(image)
var image = get_boa(image)
var json  = ee.Serializer.toJSON(image.select(0))
print(json)
var params = {
  json:json,
  type:'EXPORT_IMAGE',
  description:'test',
  region:region,
  //crs:'EPSG:4326',
  dimensions:'100x100',
  driveFileNamePrefix:'test'
}
var taskId = ee.data.newTaskId(1)
ee.data.startProcessing(taskId, params);
