if (location.protocol != 'https:')
{
  // location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
}

var updateInterval = 1000;
var avgCount = 5;
var totDist = 0;
var asked = false;

// const HAS_WARNED = 'audo_security_code_warned';

function audiSafetyCode() {
  this.limit        = 20;
  this.warned       = false;
  this.speedTimeout = false;
  this.watch_id     = null;

  this.last_check   = 0;
  this.last_lat     = 0;
  this.last_lng     = 0;

  this.speeds       = [];

  this.position_handler = (function (position) {
    // if (window.localStorage.getItem(HAS_WARNED) !== null) { return; }

    if (localStorage.getItem('allow_geolocation') !== 'true') {
      localStorage.setItem('allow_geolocation', 'true');
      analytics('event', 'geolocation', {
        'send_to': 'safetycode',
        'event_category': 'script',
        'event_label': 'allow'
      });
    }

	  asked = false;

    //console.log(position.coords);

    var seconds, hours, kpm;
    //var calcSpeed = !position.coords.speed ? 0 : position.coords.speed;
    //var speed     = calcSpeed * 3.6;
    var newTime   = Date.now();

    if(this.last_lat == position.coords.latitude && this.last_lng == position.coords.longitude)
    {
      return; // Return if same as last.
    }

    var distance  = this.distance(position.coords.latitude, position.coords.longitude);
    if (this.last_check === 0) {
      seconds = 0;
    } else {
      seconds = (newTime - this.last_check) / 1000;
    }
    hours = seconds / (60*60);

    if (hours > 0 && distance > 0) {
      kpm = Math.floor(distance / hours);
    } else {
      kpm = 0;
    }

    totDist += distance;

    if(this.speeds.length > 0 && kpm > (this.speeds[this.speeds.length-1] + 20))
    {
      kpm = this.speeds[this.speeds.length-1] + 20;
    }
    this.speeds.push(kpm);

    //console.log(this.speeds);

    var avg = 0;

    //this.speed_alert(); enable to test

    if(this.speeds.length >= avgCount)
    {
      var tmpSpeeds = this.speeds.slice(this.speeds.length-avgCount,this.speeds.length);

      var sum = 0;
      for( var i = 0; i < tmpSpeeds.length; i++ ){
        sum += tmpSpeeds[i];
      }
      avg = sum/tmpSpeeds.length;

      //console.log(avg);

      if (avg >= this.limit && kpm >= this.limit && !this.warned) {
        this.speed_alert();
      }
      if(avg <= 1)
      {
        this.warned = false;
      }

    }
    this.last_check = newTime;
    this.last_lat   = position.coords.latitude;
    this.last_lng   = position.coords.longitude;
  }).bind(this);

  this.speed_alert = function () {
    this.warned = true;

    // window.localStorage.setItem(HAS_WARNED, this.warned);

  	var alertExists = document.getElementById("speed-alert");

  	if(!alertExists)
  	{

      var modal = '<div id="speed-alert" class="modal">'
          + '<div class="modal-content">'
              + '<img class="lock" src="https://safetycode.se/popup/images/lock.png" width="52" alt="">'
               +'<img class="text-top" src="https://safetycode.se/popup/images/text-top.png" width="187" alt="">'
              + '<img class="text-button" src="https://safetycode.se/popup/images/button.png" width="160" alt="">'
              + '<img class="text-bottom" src="https://safetycode.se/popup/images/text-bottom.png" width="95" alt="">'
          + '</div>'
        + '</div>'
        + '<div class="modal-overlay"></div>'
  	  +"<style>.modal{display: block !important;bottom: auto;overflow: visible;border: 0;border-radius: 0 !important;font-family:'AudiType ExtendedNormal';font-size:10px;position:fixed;top:50%;left:50%;-ms-transform:translate(-50%,-50%);-webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);width:100%;max-width:262px;background:#fff;text-align:center;box-shadow:0 0 10px rgba(0,0,0,.3);z-index:999999}.modal-content > img {margin-left: auto; margin-right: auto; display: inline-block !important; }.modal h2,.modal strong{font-family:'AudiType ExtendedBold'}.modal-content{padding:30px 35px 17px;    text-align: center !important;border-radius: 0 !important;}}.modal p{margin-top:0}.modal strong{font-weight:400}.modal h2{font-size:18px;margin-top:24px;margin-bottom:10px}.modal .button{display:inline-block;background:#bb0a30;color:#fff;height:37px;line-height:37px;padding:0 25px;text-decoration:none;margin-top:25px;margin-bottom:40px;cursor:pointer}.modal .bottom{font-size:8px;margin-bottom:0}.lock{margin-bottom:30px}.text-top{margin-bottom:35px}.text-button{margin-bottom:45px}.modal-overlay{display:block;background-color:rgba(0, 0, 0, 0.5);position:fixed;top:0;left:0;width:100%;height:100%;z-index:999998}</style>";

  	  var div = document.createElement("div");
  	  div.innerHTML = modal;
  	  document.body.appendChild(div);

      analytics('event', 'alert', {
        'send_to': 'safetycode',
        'event_category': 'script',
        'event_label': 'show'
      });
  	}
    //var body = document.querySelector('body');
    //body.append(modal);


    var btn = document.querySelector('.text-button');
    btn.onclick = function () {
      document.querySelector('.modal').remove();
      analytics('event', 'alert', {
        'send_to': 'safetycode',
        'event_category': 'script',
        'event_label': 'close'
      });
	  document.querySelector('.modal-overlay').remove();
    };
    // Give option to say if passanger?

  };

  this.geo_error = function (error) {
    asked = false;
    switch(error.code) {
      case error.PERMISSION_DENIED:
        localStorage.setItem('allow_geolocation', 'false');
        analytics('event', 'geolocation', {
          'send_to': 'safetycode',
          'event_category': 'script',
          'event_label': 'deny'
        });
        break;

    }
  };

  this.distance = function (lat, lng) {
    if (this.last_lat === 0 || this.last_lng === 0) { return 0; }

    var radlat1 = Math.PI * lat / 180;
    var radlat2 = Math.PI * this.last_lat / 180;
    var theta   = lng - this.last_lng;
    var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515;
    // Calculates the distance into kilometers.
    dist = dist * 1.609344;
    return dist;
  }

  // Might wish to increase the timeout. It decides how long it will wait
  // before running the error-function. (geo_error)
  this.geo_options = {
    enableHighAccuracy : true,
    maximumAge         : 0,
    timeout            : 10000
  };

  var gaCode = 'UA-37192525-3';

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaCode;
  var h = document.getElementsByTagName('head')[0];
  h.appendChild(s);

  window.dataLayer = window.dataLayer || [];

  function analytics(){
    dataLayer.push(arguments);
  }
  analytics('js', new Date());
  analytics('config', gaCode, { 'send_page_view': false, 'groups': 'safetycode' });
  analytics('event', 'load', {
    'send_to': 'safetycode',
    'event_category': 'script'
  });

  this.run = function () {
    // window.localStorage.removeItem(HAS_WARNED);

    if (!'geolocation' in navigator) {
      return;
    }




    var that = this;

    if (localStorage.getItem('allow_geolocation') === 'false') { console.log('True'); return; }

    window.setInterval(function(){

      if (asked || localStorage.getItem('allow_geolocation') === 'false') { return; }

	     asked = true;

      navigator.geolocation.getCurrentPosition(
        that.position_handler, that.geo_error, that.geo_options
      )
    }, updateInterval);

  };
};