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
var mcd43_names  = kernel.mcd43_names
var get_cloud    = s2_cloud.get_cloud
var common_bands = s2_cloud.common_bands
var s2_bands     = s2_cloud.s2_bands
var l8_bands     = s2_cloud.l8_bands

var get_atmo_paras = function(image){
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
  var dia_cloud  = cloud.focal_max({kernel: ee.Kernel.circle({radius: 1500, units:  'meters'})})
  //var dia_shadow = shadow.focal_max({kernel: ee.Kernel.circle({radius: 1500, units:  'meters'})})
  image = ee.Image(image.select(s2_bands.slice(0,6), common_bands.slice(0,6)).divide(10000)
                        .updateMask(dia_cloud.eq(0))
                        .copyProperties(image))//
                        .set('system:time_start', image.get('system:time_start'))
  var collection = ee.ImageCollection('MODIS/006/MCD43A1')
                          .filterDate(image_date, ee.Date(image_date).advance(1, 'day'))
                          .filterBounds(geom)
                          .select(mcd43_names)

  var rgbVis = {
        min: 0.0,
        max: 0.4,
        bands: ['RED', 'GREEN', 'BLUE'],
      };
  var mcd43Vis = {
        min: 0.0,
        max: 0.4,
        bands: ['BRDF_Albedo_Parameters_Band1_iso', 'BRDF_Albedo_Parameters_Band4_iso', 'BRDF_Albedo_Parameters_Band3_iso'],
      };
 
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
                    .filterDate(image_date, ee.Date(image_date).advance(1, 'day'))
                    .first()
                    .select('ozone')
                    .multiply(0.001)
                    .reduceRegion(ee.Reducer.mean(), geom)
                    
  
  var tco3  = ee.Image(ee.Number(tco3.get('ozone'))).rename('tco3')
  var elevation = ee.Image('USGS/SRTMGL1_003').select('elevation').multiply(0.001)
  var image3 = ee.Image.cat([image.select('BLUE').reproject(crs, null, 500).float(), 
                             image.select('GREEN').reproject(crs, null, 500).float(), 
                             mcd43a1.select('BRDF_Albedo_Parameters_Band3_iso').reproject(crs, null, 500).float(),
                             mcd43a1.select('BRDF_Albedo_Parameters_Band3_vol').reproject(crs, null, 500).float(),
                             mcd43a1.select('BRDF_Albedo_Parameters_Band3_geo').reproject(crs, null, 500).float(),
                             mcd43a1.select('BRDF_Albedo_Parameters_Band4_iso').reproject(crs, null, 500).float(),
                             mcd43a1.select('BRDF_Albedo_Parameters_Band4_vol').reproject(crs, null, 500).float(),
                             mcd43a1.select('BRDF_Albedo_Parameters_Band4_geo').reproject(crs, null, 500).float(),
                             cos_sza.reproject(crs, null, 500).float(),
                             cos_vza.reproject(crs, null, 500).float(),
                             cos_raa.reproject(crs, null, 500).float(),
                             tco3.reproject(crs, null, 500).float().rename('tco3'),
                             elevation.reproject(crs, null, 500).float().rename('ele'),
                             ]).clip(geom).float()

  var result = image.select(['simu_boa_b6', 'SWIR2']).reproject(crs, null, 500).float().reduceRegion(ee.Reducer.toList(), geom, 120);
  var yValues = ee.Array(result.get('simu_boa_b6'));
  var xValues = ee.Array(result.get('SWIR2'));
  var boa_diff  = image.select('simu_boa_b5').subtract(image.select('SWIR1')).rename('diff')
  var pp = boa_diff.reproject(crs, null, 500).float()
                   .reduceRegion(ee.Reducer.percentile([15, 50, 85]), geom)
  var diff_min  = ee.Number(pp.get('diff_p15'))
  var diff_max  = ee.Number(pp.get('diff_p85'))
  var stab_mask = (boa_diff.lte(diff_max)).and(boa_diff.gte(diff_min))
  var boa_diff  = image.select('simu_boa_b6').subtract(image.select('SWIR2')).rename('diff')              
  var pp = boa_diff.reproject(crs, null, 500).float()
                   .reduceRegion(ee.Reducer.percentile([15, 50, 85]), geom)
  var diff_min  = ee.Number(pp.get('diff_p15'))
  var diff_max  = ee.Number(pp.get('diff_p85'))
  var stab_mask = (boa_diff.lte(diff_max))
                           .and(boa_diff.gte(diff_min))
                           .and(stab_mask)
  var median = ee.Number(pp.get('diff_p50'))
  //print(median.get('diff'))                
  var diff_min  = ee.Number(median).subtract(0.02)
  var diff_max  = ee.Number(median).add(0.02)
  var stab_mask = (boa_diff.lte(diff_max)).and(boa_diff.gte(diff_min)).and(boa_diff.abs().lt(0.03))
  
  var BLUE = image3.select('BLUE')
  var pp   = BLUE.reduceRegion(ee.Reducer.percentile([10, 90]), geom)
  var BLUE_min  = ee.Number(pp.get('BLUE_p10'))
  var BLUE_max  = ee.Number(pp.get('BLUE_p90'))
  var BLUE_mask = (image3.select('BLUE').lte(BLUE_max)).and(image3.select('BLUE').gte(BLUE_min))
  
  var SWIR2 = image.select('SWIR2').reproject(crs, null, 500).float()
  var pp = SWIR2.reduceRegion(ee.Reducer.percentile([10, 90]), geom)
  var SWIR_min  = ee.Number(pp.get('SWIR2_p10'))
  var SWIR_max  = ee.Number(pp.get('SWIR2_p90'))
  var SWIR_mask = (SWIR2.lte(SWIR_max)).and(SWIR2.gte(SWIR_min))
  image3 = image3.updateMask(BLUE_mask.and(stab_mask).and(image3.mask()).and(SWIR_mask ))

  
  var aot = tnn.predict(image3, inverse_6S_AOT.Inverse_6S_AOT_brdf_H1_scale,
                                inverse_6S_AOT.Inverse_6S_AOT_brdf_H1_offset,
                                inverse_6S_AOT.Inverse_6S_AOT_brdf_H2_scale,
                                inverse_6S_AOT.Inverse_6S_AOT_brdf_H2_offset,
                                inverse_6S_AOT.Inverse_6S_AOT_brdf_Out_scale,
                                inverse_6S_AOT.Inverse_6S_AOT_brdf_Out_offset).rename('aot')
  
  var valid_pix = aot.mask().reduceRegion({reducer: ee.Reducer.sum(), 
                                              geometry : geom, 
                                              scale : 500, 
                                              maxPixels:10e13 })
  //print()
  //ee.Algorithms.If(ee.Number(valid_pix.get('aot')).lt(5), null, )
  var pp = aot.reduceRegion(ee.Reducer.percentile([10, 50, 90]), geom)
  var aot_min  = ee.Number(pp.get('aot_p10'))
  var aot_max  = ee.Number(pp.get('aot_p90'))
  var median   = ee.Number(pp.get('aot_p50'))
  var aot_mask = (aot.lte(aot_max)).and(aot.gte(aot_min))
  aot = aot.updateMask(aot_mask.and(aot.mask()))

  var options = {
    title: 'AOT',
    fontSize: 20,
    hAxis: {title: 'AOT'},
    vAxis: {title: 'count of DN'},
    series: {
      0: {color: 'blue'},
      1: {color: 'green'},
      2: {color: 'red'},
      3: {color: 'magenta'}}
  };
  var palettes = require('users/gena/packages:palettes');
  var palette = palettes.colorbrewer.YlOrRd[9]
  
  
  var histogram = ui.Chart.image.histogram(aot, geom, 500)
      .setSeriesNames(['AOT'])
      .setOptions(options);
  //print(histogram)
  var label = ui.Label('AOT median: ');
  //print(label)
  //print(median)
  var filled_aot = aot.unmask().where(aot.mask().eq(0), ee.Number(median))
  var kernelSize = 10
  var ker = ee.Kernel.square(kernelSize * 500, "meters")
  aot     = filled_aot.reduceNeighborhood({reducer: ee.Reducer.mean(), 
                                          kernel: ker,
                                          inputWeight: 'mask',
                                          skipMasked:false,
                                          optimization:'boxcar',
                                        }).rename('aot')
  aot = aot.max(0.001)
  // var aot = ee.Image(0.13).rename('aot')
  // aot = filled_aot.convolve(ee.Kernel.gaussian({radius: 3000, sigma: 1000, units: 'meters',normalize: true,})).rename('aot')
  //Map.addLayer(filled_aot, {min:0.13, max:0.2, palette: palette}, 'AOT')
  var control = ee.Image.cat([ image2.select('B9'), 
                               image2.select('B8A'), 
                               cos_sza, cos_vza, cos_raa, aot, tco3, elevation])
                              .updateMask(dia_cloud.eq(0).and(image2.select('B8A').gt(0.12)))//.and(dia_shadow.eq(0))
                              .reproject(crs, null, 500).float()
                              .float()
  var tcwv = tnn.predict(control,inverse_S2_TCWV.Inverse_S2_TCWV_H1_scale,
                                inverse_S2_TCWV.Inverse_S2_TCWV_H1_offset,
                                inverse_S2_TCWV.Inverse_S2_TCWV_H2_scale,
                                inverse_S2_TCWV.Inverse_S2_TCWV_H2_offset,
                                inverse_S2_TCWV.Inverse_S2_TCWV_Out_scale,
                                inverse_S2_TCWV.Inverse_S2_TCWV_Out_offset).rename('tcwv')
  var rgbVis = {
        min: 0.0,
        max: 0.2,
        bands: ['B04', 'B03', 'B02'],
      };
  
  var cloudVis = {
    min: 0,
    max: 1,
    bands: ['cloud'],
    opacity: 0.4,
  };
  var shadowVis = {
    min: 0,
    max: 1,
    bands: ['shadow'],
    opacity: 0.4,
  };
  var rgbVis = {
        min: 0.0,
        max: 0.2,
        bands: ['RED', 'GREEN', 'BLUE'],
      };
  // Map.addLayer(img.select(rgbVis['bands']), rgbVis, 'TOA')
  // Map.addLayer(img.select('cloud').clip(geom), cloudVis, 'cloud')
  // Map.addLayer(img.select('shadow').clip(geom), shadowVis, 'shadow')
  // Map.addLayer(img, {},'img',false)
  
  var pp = tcwv.reduceRegion(ee.Reducer.percentile([10, 50, 90]), geom)
  var tcwv_min  = ee.Number(pp.get('tcwv_p10'))
  var tcwv_max  = ee.Number(pp.get('tcwv_p90'))
  var median    = ee.Number(pp.get('tcwv_p50'))
  var tcwv_mask = (tcwv.lte(tcwv_max)).and(tcwv.gte(tcwv_min))
  tcwv = tcwv.updateMask(tcwv_mask.and(tcwv.mask()))
  var options = {
    title: 'TCWV',
    fontSize: 20,
    hAxis: {title: 'TCWV'},
    vAxis: {title: 'count of DN'},
    series: {
      0: {color: 'blue'},
      1: {color: 'green'},
      2: {color: 'red'},
      3: {color: 'magenta'}}
  };
  var palettes = require('users/gena/packages:palettes');
  var palette = palettes.colorbrewer.YlOrRd[9]
  var histogram = ui.Chart.image.histogram(tcwv, geom, 500)
      .setSeriesNames(['TCWV'])
      .setOptions(options);
  //print(histogram)
  var label = ui.Label('TCWV median: ');
  //print(label)
  //print(median)
  var filled_tcwv = tcwv.unmask().where(tcwv.mask().eq(0), ee.Number(median))
  var kernelSize = 6
  var ker = ee.Kernel.square(kernelSize * 500, "meters")
  tcwv     = filled_tcwv.reduceNeighborhood({reducer: ee.Reducer.mean(), 
                                          kernel: ker,
                                          inputWeight: 'mask',
                                          skipMasked:false,
                                          optimization:'boxcar',
                                        }).rename('tcwv')
  tcwv = tcwv.max(0.001)
  //tcwv = filled_tcwv.convolve(ee.Kernel.gaussian({radius: 3000, sigma: 1000, units: 'meters',normalize: true,}))
  //var tco3 = tco3.reproject(     crs, null, 500).float().rename('tco3')
  //var ele  = elevation.reproject(crs, null, 500).float().rename('ele')
  // var cloud = image.select('cloud')
  // var tcwv  = image.select('tcwv')
  // var shadow= image.select('shadow')
  // //var ele        = image.select('ele')
  // var aot   = image.select('aot')
  // var cloud = ee.Image(0)
  // var shadow = ee.Image(0)
  // var aot     = ee.Image(0.13)
  
  // image = ee.Image(image.select(s2_bands.slice(0,6), common_bands.slice(0,6)).divide(10000)
  //                       .copyProperties(image))//
  //                    .set('system:time_start', image.get('system:time_start'))
  // Map.addLayer(aot.clip(geom),  {min: 0.5,max: 0.7},  'AOT')
  // Map.addLayer(tcwv.clip(geom), {min: 0.7, max: 1.2}, 'TCWV')
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
  var tco3 = ee.ImageCollection('TOMS/MERGED')
                    .filterDate(image_date, ee.Date(image_date).advance(1, 'day'))
                    .first()
                    .select('ozone')
                    .multiply(0.001)
                    .reduceRegion(ee.Reducer.mean(), geom)
                    
  var tco3  = ee.Image(ee.Number(tco3.get('ozone'))).rename('tco3')
  var ele = ee.Image('USGS/SRTMGL1_003').select('elevation').multiply(0.001)
  //var aot     = image.select('aot')
  //var tcwv    = image.select('tcwv')
  var res = 500
  var image4 = ee.Image.cat([cos_sza, cos_vza, cos_raa, aot, tcwv, tco3, ele])
                       .reproject(crs, null, res).float()
                       .clip(geom)
  
  var name     = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B10', 'B11', 'B12']
  var new_name = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B8A', 'B09', 'B10', 'B11', 'B12']
  //print(image4)
  var box = ee.Geometry.Polygon(
        [[[-120.37098201845271, 36.45542085240064],
          [-120.37098201845271, 36.01233852009161],
          [-119.56348690126521, 36.01233852009161],
          [-119.56348690126521, 36.45542085240064]]], null, false);
  var rgb = s2b_ac.S2B_AC(image4, image2.select(name, new_name).reproject(crs, null, 500))
                        .select(['B02', 'B03', 'B04'])
    var rgbVis = {
        min: 0.0,
        max: 0.2,
        bands: ['B04', 'B03', 'B02'],
      };
  var sur = ee.Image('users/marcyinfeng/S2B_MSIL1C_20180115T030049_N0206_R032_T50SND_20180115T063319_10m_sur')
  //Map.addLayer(sur.multiply(0.0001), rgbVis, 'SUR')
  var fname = ee.String(image.get('PRODUCT_ID')).getInfo() 
  //var boa   = ee.Image.cat([blue_boa, green_boa, red_boa, nir_boa, swir1_boa, swir2_boa]).multiply(10000).toInt()
  var boa = s2b_ac.S2B_AC(image4, image2.select(name, new_name)).multiply(10000).toInt()
  //print(boa.select(['B02', 'B03', 'B04', 'B8A']).getDownloadURL({scale: 10, name: fname + '10m_sur', region: JSON.stringify(geom.getInfo())}))
  Export.image.toDrive({
              image: boa.select(['B02', 'B03', 'B04', 'B08']),
              description: fname + '_10m_sur',
              scale: 10,
              fileFormat: 'GeoTIFF',
              folder:'S2_SUR',
              region: geom,
              maxPixels: 1e13
            })
  // Export.image.toAsset({
  //             image: boa.select(['B02', 'B03', 'B04', 'B08']),
  //             description: fname + '_10m_sur',
  //             assetId: fname + '_10m_sur',
  //             scale: 10,
  //             region: geom,
  //             maxPixels: 1e13
  //           });
  Export.image.toDrive({
              image: boa.select(['B05', 'B06', 'B07', 'B8A', 'B11', 'B12']),
              description: fname + '_20m_sur',
              scale: 20,
              fileFormat: 'GeoTIFF',
              folder:'S2_SUR',
              region: geom,
              maxPixels: 1e13
            })
  Export.image.toDrive({
              image: boa.select(['B01', 'B09']),
              description: fname + '_60m_sur',
              scale: 60,
              fileFormat: 'GeoTIFF',
              folder:'S2_SUR',
              region: geom,
              maxPixels: 1e13
            })
  var cloud_shadow = cloud.toByte()//.add(shadow.toByte().multiply(2))
  Export.image.toDrive({
              image: cloud_shadow,
              description: fname+ '_cloud',
              scale: 10,
              fileFormat: 'GeoTIFF',
              folder:'S2_SUR',
              region: geom,
              maxPixels: 1e13
             })
  aot = aot.multiply(100).toInt().reproject(image.select('BLUE').projection(), null, 500)
  Export.image.toDrive({
              image: aot,
              description: fname + '_aot',
              scale: 500,
              fileFormat: 'GeoTIFF',
              folder:'S2_SUR',
              region: geom,
              maxPixels: 1e13
             })
  tcwv = tcwv.multiply(100) .toInt().reproject(image.select('BLUE').projection(), null, 500)
  Export.image.toDrive({
              image: tcwv,
              description: fname + '_wv',
              scale: 60,
              fileFormat: 'GeoTIFF',
              folder:'S2_SUR',
              region: geom,
              maxPixels: 1e13
             })
  Export.image.toDrive({
              image: tco3,
              description: fname + '_o3',
              scale: 500,
              fileFormat: 'GeoTIFF',
              folder:'S2_SUR',
              region: geom,
              maxPixels: 1e13
             })
}
var siac = function(image){
  var atmo_paras = get_atmo_paras(image)
  siac_ac(image.addBands(atmo_paras))
}
// var s2_file = '20190303T184259_20190303T184825_T10SGF'
// var s2_file = '20180115T030049_20180115T030132_T50SND'
// var image = ee.ImageCollection('COPERNICUS/S2').filterMetadata('system:index', 'equals', s2_file)
//                       .first()
// var id = 'S2A_MSIL1C_20190227T030651_N0207_R075_T50SMG_20190227T074020'
// var image = ee.ImageCollection('COPERNICUS/S2').filterMetadata('PRODUCT_ID', 'equals', id)
//                       .first()
// print(image)
// get_atmo_paras(image)
exports.siac = get_atmo_paras

