/* basically what we'ver done is turn mapfunctions into a constructor to better
separate concerns where more than one map might be added to the DOM. And add in
the functions written in guidesFront*/

/*
baseelem takes a querySelector, height takes a desired height for the map and
dataRoute takes a route from which data will be fetched to then add to the map
like '/guides/guide'

note that dataRoute is passed as a param, therefore can't be switched on and off
like other part of the object constructor
*/

/** @constructor */
//pass a queryselector or an html element
function MapFunctions(baseelem, height){
  if(typeof baseelem === 'string'){
    baseelem = document.querySelector(baseelem);
  }
  //locally scoped characteristics of the map
  var textinput,
      buttonBase,
      searchLocationBtn,
      locationOptions,
      locations,
      lat,
      lng,
      text,
      guidemarker,
      enableroute,
      circle,
      distance,
      travelTime,
      travelCost,
      locationValid,
      notNext,
      reverseGeocodeResult,
      coordinates,
      providerCoordinates,
      firstclick = 0,
      meetingPointType,
      map,
      save,
      customRoute,
      swapMarkerparam,
      typeDropdownOption = false,
      clientLocation = L.layerGroup(),
      markers =  new L.MarkerClusterGroup({
        spiderfyDistanceMultiplier: 2
      }),
      radiae = L.layerGroup(),
      circles = L.layerGroup(),
      //contains the actual markers
      arrayOfMarkers = [],
      //contains the reference to the individual marker
      madeMarkers = [],
      //contains the type of servive the marker represents to filter by type:
      indexByType = [],
      displayed = false;

    /**
     * @param {string} sport -A sport category e.g. 'cycling-training'
     * @param {boolean} cards -If replies to queries made through this call should
     * rendered and sent or sent as a raw object string.
     * @param {string} link -Takes a a link to which to post requests for data.
     * @return {function} A function call on mapEvent(), to which the aforementioned parameters are passed.
     */
    this.dataRoute = function(sport, cards, link){
      mapEvents(sport, cards, link);
      return this;
    };
    /**
    * @return {Object} map returns the leaflet map object belonging to the instance.
    */
    this.map = function(){
      return map;
    };
    /*This options removes the typical next next behaviour*/
    this.notnext = function(){

      notNext = true;

      return this;
    };

    this.removeMap = function(){
      map.remove();
    };

    this.mapcanvas = L.canvas({});
    this.generateMap =
      function(tileURL){
        if(displayed === false){
          var trainingArea = document.createElement('div');
          baseelem.appendChild(trainingArea);
          coordinates = document.createElement('div');
          trainingArea.appendChild(coordinates);
          trainingArea.style.height = height;
          //added width
          trainingArea.style.width = '100%';

          map = L.map(trainingArea, { layers: [
              L.tileLayer(tileURL, {
              attribution: "<a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
            })],
            preferCanvas: true,
            center: [37.09681, -8.41965],
            zoom: 11
          });
          L.control.scale().addTo(map).setPosition('bottomright');

/*
          map.on('click', function btnnext(e){
            if(e.target.classList.contains('btnnext')){
              alert('b');
            }
          });*/


        }
        displayed = true;
        return this;
      };

    this.invalidateSize = function invalidateSize(){
      return map.invalidateSize();
    };

    this.returnBounds = function returnBounds(){
      return map.getBounds();
    };

    this.returnCoordinates = function(){
      return returnCoordinates();
    };

    function returnCoordinates(){
      return (lat && lng) ? {lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5))} : null;
    }

    this.reverseGeocode = function(coordinates){
      return reverseGeocode(coordinates);
    };

    function reverseGeocode(coordinates){
      //adapt this so it can take coordinates too.
      var nominatimURL = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
        returnCoordinates().lat +'&lon=' + returnCoordinates().lng +'&zoom=18&addressdetails=1';

      var xhr = new XMLHttpRequest();
        xhr.open('GET', nominatimURL);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
        xhr.onreadystatechange = function () {
          if(xhr.readyState === 4 && xhr.status === 200) {
            var address = JSON.parse(xhr.responseText);
            reverseGeocodeResult = address.display_name;

          }
        };
        return this;
    }

    /*Note that while searchLocation is a method, its typical use is to be called
    through the search button rendered above. It can though be called independantly
    just passing a location string which might be handy*/
    this.searchLocation = function(location, mapAsParam){
      return searchLocation(location, mapAsParam);
    };

    function searchLocation(location,mapAsParam){
      if(mapAsParam){
        map = mapAsParam;
      }
      var clientLocationInput;
      if(location === undefined || location === null){
        clientLocationInput = textinput.value;
      }
      else{
        clientLocationInput = location;
      }

      //possibly use our own instance soon:
      var nominatimURL = 'https://nominatim.openstreetmap.org/search/' +
        encodeURIComponent(clientLocationInput) + '?format=json';

      var locationResponse;

      var xhr = new XMLHttpRequest();
        xhr.open('GET', nominatimURL);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
        xhr.onreadystatechange = function () {
          if(xhr.readyState === 4 && xhr.status === 200) {
            var locationResponse = JSON.parse(xhr.responseText);
            //first child
            var subtitle = document.createElement('h3');
            subtitle.textContent = 'Pick a location from the options bellow:';
            if(!locationOptions.firstChild){
              locationOptions.appendChild(subtitle);
            }
            //all this to overwrite an element:
            locationOptions.removeChild(locationOptions.firstChild);
            locations = document.createElement('div');

              var tit = document.createElement('h3');
              tit.textContent ='Choose a location';
              locations.append(tit);
            //prints response
            for(var i = 0; i < locationResponse.length; i++){
              var option = locationResponse[i]['display_name'];
              var div = document.createElement('div');
                  div.textContent = option;
                  div.dataset.lat = locationResponse[i]['lat'];
                  div.dataset.lng = locationResponse[i]['lon'];
                  div.classList.add('locationsCss');
                  div.addEventListener('click', function(){

                    map._container.scrollIntoView({block: 'start',  behavior: 'smooth' });
                  });
                  locations.appendChild(div);
              if(i === locationResponse.length -1 ){
                locationOptions.appendChild(locations);
                attachEvents();
              }
            }
          }
        };
      }

    /*This function attaches events to the locations found for a given input. It could
      be improved by taking params elems to affect and target function ref*/
    this.attachEvents = function(targetfunctions){
      return  attachEvents(targetfunctions);
    };

    function attachEvents(targetfunctions) {
      var elems = locations.children;
      for(var i = 0; i < elems.length; i++){
        attach(elems[i], 'click');
      }
    }
    //10 arguments
    this.assembleButtons = function(
          baselemForBtns,
          searchLocationParam,
          id,
          getMyLocationParam,
          locationid,
          guidePoint,
          route,
          mapAsParam,
          titleText,
          explanatoryParagraph
        ){
        baselemForBtns = document.querySelector(baselemForBtns);
        buttonBase = baselemForBtns;

        baselemForBtns.classList.add('emphasis', 'center');
        locationOptions = document.createElement('div');
        locationOptions.classList.add('locationOptions');
        if(titleText){
          var title = document.createElement('h2');
          // ,'block' removed
          title.classList.add('center', 'findaguide', 'item');
          title.textContent = titleText;
          baselemForBtns.appendChild(title);
        }
        var expPara = document.createElement('div');
        expPara.classList.add('emphasis','block');
        var expParaText = document.createElement('p');
        expParaText.textContent = explanatoryParagraph;
        baselemForBtns.appendChild(expPara);
        expPara.appendChild(expParaText);

        if(guidePoint){
          meetGuide = document.createElement('button');
          meetGuide.classList.add('btn', 'sms2', 'item', 'guidePoint', 'block', 'center');
          meetGuide.textContent = 'Meet guide at their meetup point';
          meetGuide.setAttribute('type','button');
          meetGuide.addEventListener('click', function(event) {
            event.preventDefault();
            var co = JSON.parse(baseelem.dataset.coordinates);
            lat = co[0];
            lng = co[1];
            meetingPointType = 'guidePoint';

            var link = 'Coordinates to meet at: ' + returnCoordinates().lat +
             ',' + returnCoordinates().lng + '. Link with directions: ';
            var locationPara = document.createElement('p');
            locationPara.textContent = link;

            var ahref = document.createElement('a');

            //  37.101176,-8.468057//@37.1009854,-8.4724567
            //  //37.101176,-8.468057/@37.1009854,-8.4724567
            var googlelink = 'https://www.google.com/maps/dir//' + returnCoordinates().lat + ',' + returnCoordinates().lng;
            ahref.setAttribute('href', googlelink);
            ahref.setAttribute('target', '_blank');
            ahref.textContent = 'https://www.google.com/maps/dir//' + returnCoordinates().lat + ',' + returnCoordinates().lng;
            document.getElementById('coordinates').appendChild(locationPara);
            locationPara.appendChild(ahref);
            ahref.style.textAlign = 'center';

            document.querySelector('#coordinates').scrollIntoView({block: 'start',  behavior: 'smooth' });
            document.querySelector('#coordinates').classList.add('infodiv', 'bounce');
          });
          baselemForBtns.appendChild(meetGuide);
        }
        //search by entering location
        if(searchLocationParam){
          textinput = document.createElement('input');
          textinput.setAttribute('type', 'text');
          textinput.classList.add('clientLocation', 'bookguide', 'item');
          textinput.setAttribute('placeholder', 'Enter address');

          searchLocationBtn = document.createElement('button');
          searchLocationBtn.classList.add('btn', 'btn-primary', 'sms2', 'btn-lg');
          searchLocationBtn.textContent = 'Search';
          searchLocationBtn.setAttribute('type','button');
          if(id){
            searchLocationBtn.id = id;
          }
          /******EVENT*********************/
          searchLocationBtn.addEventListener('click', function(event) {
            event.preventDefault();
            meetingPointType = 'searchedLocation';
            searchLocation(null, mapAsParam);
          });

          baselemForBtns.appendChild(textinput);
          baselemForBtns.appendChild(searchLocationBtn);
          baselemForBtns.appendChild(locationOptions);
        }

        //get browser location
        if(getMyLocationParam){
          locationBtn = document.createElement('button');
          locationBtn.classList.add('btn', 'sms2', 'bounceOnHover', 'item');
          locationBtn.textContent = 'Get your current location';
          locationBtn.setAttribute('type','button');
          if(locationid){
            locationBtn.id = id;
          }
          /******EVENT*********************/
          locationBtn.addEventListener('click', function(event) {
            event.preventDefault();
            if(route){
              meetingPointType = 'currentLocation';
              locate(map);
            }
            else{
              meetingPointType = 'currentLocation';
              locate(mapAsParam);
            }
          });
          baselemForBtns.appendChild(locationBtn);
        }
        return this;
      };


    this.geoCodeResult = function(){
      return reverseGeocodeResult;
    };



    this.locate = function(mapAsParam){
      locate(mapAsParam);
      return this;
    };

    function locate(mapAsParam) {
      if(mapAsParam){
        map = mapAsParam;
      }
      map.locate();

      map.on('locationfound', function(e){

        lat = e.latlng.lat;
        lng = e.latlng.lng;
        swapMarker(e.latlng.lat, e.latlng.lng, "Your current location", true);
        if(route){
          route([{lat: e.latlng.lat, lng: e.latlng.lng},{lat: lat, lng: lng}]);
        }


        baseelem.scrollIntoView({block: 'start',  behavior: 'smooth' });
        //enableRoute();
      });
      map.on('locationerror', function(e){

      });
    }

    //n.b. pass a reference to the global lat, lng, text here if you want to use
    //those. If you want to use different values, pass them directly:
    this.swapMarker = function(latparam, lngparam, textparam, clientLocation){
      swapMarker(latparam, lngparam, textparam, clientLocation);

      return this;
    };

    this.test = function(){
      markers.clearLayers();
    };

    function swapMarker(latparam, lngparam, textparam, clientLocationArg){
      //
      if(latparam !== undefined){lat = latparam;}
      if(lngparam !== undefined){lng = lngparam;}
      if(textparam !== undefined){text = textparam;}
      if(typeof lat === String){lat = parseFloat(lat);}
      if(typeof lng === String){lng = parseFloat(lng);}


      (function markerGroup(){
        if(clientLocationArg){
          clientLocation.clearLayers();
          return addMarker(lat, lng, false, clientLocation);
        }
        else{
          markers.clearLayers();
          return addMarker(lat, lng, false, markers);
        }
      })();

      function addMarker(lat, lng, draggable, group){
        //
        var marker = L.marker([lat, lng], {draggable: draggable}).addTo(group);
        marker.on('moveend', function(){
          var latlng = marker.getLatLng();
          swapMarker(latlng.lat, latlng.lng, 'New position', clientLocation);
        });
        var displayco = document.createElement('p');
        displayco.textContent = 'Your coordinates: ' + lat + ',' + lng;

        while (coordinates.firstChild) {
          coordinates.removeChild(coordinates.firstChild);
        }
        coordinates.appendChild(displayco);
        group.addTo(map);

        map.setView([lat, lng], 11);

        if(text !== null){
          marker.bindPopup(text).openPopup();
          if((typeof(folder2) !== "undefined")){
            folder2.reattachEvents();
          }
        }
      }

    }

    this.meetUp = function(){
      return meetingPointType;
    };

    function meetUp(){
      return meetingPointType;
    }

    this.addGuideRadius = function(coordinates, radius, differentmap, addtomap, checkWithinRadius, customMessage){
      addGuideRadius(coordinates, radius, differentmap, addtomap, checkWithinRadius, customMessage);
      return this;
    };

    function addGuideRadius(coordinates, radius, differentmap, addtomap, checkWithinRadius, customMessage){

      if(checkWithinRadius){
        map.addEventListener('click', function withinCircle(e) {
          if(!withinRadius(coordinates, returnCoordinates(), radius)){
            if(swiftmoAlert){
              swiftmoAlert.setContent(customMessage).toggle();
              return;
            }
            else{
              alert(customMessage);
            }
          }
        });
      }
      if(circle){
        map.removeLayer(circle);
      }
      if(differentmap){
      //  map = document.querySelector(differentmap);
      }
      if(coordinates){
        circle = L.circle(coordinates, radius * 1000);
        if(addtomap){
          circle.addTo(map);
        }
        return circle;
      }
      else{
        el = baseelem;
        circle = L.circle(JSON.parse(el.dataset.coordinates),parseInt(el.dataset.radius *1000));
        if(addtomap){
          circle.addTo(map);
        }
        return circle;
        //= L.circle(JSON.parse(trainingArea.parentElement.dataset.coordinates),parseInt(trainingArea.parentElement.dataset.radius *1000)).addTo(map);
      }

    }

    this.distance = function(){
      return distance;
    };

    this.locationValid = function(){
      return locationValid;
    };

    this.travelTime = function(){
      return travelTime;
    };

    this.travelCost = function(){
      return travelCost;
    };

    //Enable routing is a simple switch built into all the location functions, called with no options
    this.enableRouting = function(){
      enableRouting();
      return this;
    };

    function enableRouting(){

      enableroute = true;
      return this;
    }

    this.returnProviderCoordinates = function(){
      return providerCoordinates;
    };

    //Plugs directly into LRM from here, might be worth thinking about having this
    //free instead of referencing all the methods, for each map here, just pointing
    //LRM to a map. and then creating a separate div (for example) with directions.
    //Separte module effectively.

    //target and points required
    this.route = function(points, draggable, whileDragging){
      route(points, draggable, whileDragging);
      return this;
    };


    //route([guidesSt.coordinates,{lat: lat, lng: lng}], false, false);
    function route(points, draggable, whileDragging){
      if(!points){
        points = [JSON.parse(baseelem.dataset.coordinates), {lat: lat, lng: lng}];
      }

      let target = baseelem.dataset.coordinates;
      providerCoordinates = points[0];



      if(customRoute){
        customRoute.getPlan().setWaypoints([]);
      }
      setRouteServer('https://routing.swiftmo.com', 'routing');

      /*
      xhrget({}, 'https://routing.swiftmo.com:8888', function(e){

        if(e === '404'){
          setRouteServer('http://router.project-osrm.org/route/v1/viaroute', 'driving');
        }
        else{
          setRouteServer('https://routing.swiftmo.com:8888', 'dontget');
        }
      });*/

    function setRouteServer(route, profile){
      customRoute = L.Routing.control({
        serviceUrl: route,
        timeout: 5000,
        profile: profile,
        show: false,
        waypoints: points,
        draggableWaypoints: draggable,
        routeWhileDragging: whileDragging,
        createMarker: function(i, wp) {
          var marker = L.marker(wp.latLng, {
            //note this draggable is an option we pass, it's a boolean:
            draggable: draggable,
          }).addTo(markers);
          return marker;
        },
        lineOptions: {
          styles: [{color: 'blue', opacity: 1, weight: 4, width: '4px'}]
        }
      });

      customRoute.on('routingerror', function(e){
        swiftmoAlert.setContent('Ops, we couldn\'t find a route between these points').toggle();
        return;
      });

      customRoute.on('routeselected', function(e) {

        function returnTime(km, timeperkm){
          var skm = km * timeperkm;
          var sec_num = parseInt(skm, 10);
          var h = Math.floor(sec_num / 3600);
          var m = Math.floor(sec_num / 60) % 60;
          var s = sec_num % 60;

          var minnought = function(mh){

            if(mh.toString().length === 1 && mh === m){
              return ':0';
            }
            if(mh.toString().length === 1 && mh === h){
              return '0';
            }
            else{
              return ':';
            }
          };
          return minnought(h) + h + minnought(m) + m + ":" + s;
        }

        distance = (e.route.summary.totalDistance/1000).toFixed(2) * 2;
        traveltime = returnTime(distance, 90);
        travelCost = parseInt(baseelem.dataset.travelcharge * distance);

        var routetitle = "This requires a " + distance + " km return trip taking about " + traveltime + " h.";

        if(baseelem.dataset.travelcharge != 0){
          routetitle += " This has an added cost of €" + (travelCost / 100).toFixed(2) + ".";
        }

        var routedistance = (e.route.summary.totalDistance/1000).toFixed(1);
        //gmarkers = markers;
        //var popup = .bindPopup(L.popup({autoPan : false}).setContent(popOverContent())).openPopup();
        markers._needsClustering[1].bindPopup(L.popup({autoPan : false}).setContent(popOverContent())).openPopup();

        function popOverContent(){
          var div = document.createElement('div');
              //div.classList.add('emphasis');

          var distanceDisplay = document.createElement('p');
              distanceDisplay.textContent = routetitle;

              div.appendChild(distanceDisplay);

              //distanceDisplay.classList.add('highlightOnEmphasis');
          var btn = document.createElement('button');
              btn.classList.add('btn', 'sms2', 'autosave', 'btnnext', 'confirmDelivery');
              btn.setAttribute('type', 'button');
              btn.dataset.pageid = '6';
              btn.textContent = 'Confirm delivery';

              div.appendChild(btn);

          var span = document.createElement('span');
              span.classList.add('glyphicon','glyphicon-ok','conftick2');

              div.appendChild(span);

          return div;
        }

        var div = document.createElement('div');
            div.classList.add('emphasis');

        var distanceDisplay = document.createElement('p');
            distanceDisplay.textContent = routetitle;

            div.appendChild(distanceDisplay);

            //distanceDisplay.classList.add('highlightOnEmphasis');
        var btn = document.createElement('button');
            btn.classList.add('btn', 'sms2', 'autosave', 'btnnext', 'confirmDelivery');
            btn.setAttribute('type', 'button');
            btn.dataset.pageid = '6';
            btn.textContent = 'Confirm delivery';

            div.appendChild(btn);

        var span = document.createElement('span');
            span.classList.add('glyphicon','glyphicon-ok','conftick2');

            div.appendChild(span);

        while (locationOptions.firstChild) {
          locationOptions.removeChild(locationOptions.firstChild);
        }
            locationOptions.appendChild(div);

          //button.btn.sms2.autosave.btnnext#confirmDelivery(type='button' data-pageID='6') Confirm delivery

      }).addTo(map);
    }



    }

    this.addGuideMarker = function(coordinates, message){
      addGuideMarker(coordinates, message);
      return this;
    };
    //it defaults to the map that the call generates, pass coordinates if different:
    function addGuideMarker(coordinates, message){

      if(message === undefined){
        message = 'This guide\'s meetup point';
      }
      if(coordinates){

        guidemarker = L.marker(coordinates, {draggable: false}).addTo(map);
        guidePoint = guidemarker.bindPopup(message).openPopup();
      }
      else{
        guidemarker = L.marker(JSON.parse(baseelem.dataset.coordinates), {draggable: false}).addTo(map);
        guidePoint = guidemarker.bindPopup('This guide\'s meetup point').openPopup();
      }
      return this;
    }

    this.locateOnClick = function(swapMarker, circle, save, routeArg){
      locateOnClick(swapMarker, circle, save, routeArg);
      return this;
    };

    function locateOnClick(swapMarkerparam, circle, save, routeArg) {
      swapMarkerparam = swapMarkerparam;
      //save = save;

      map.addEventListener('click', function onLocationFound(e) {
        if(circle){
          map.removeLayer(circle);
        }

        if(firstclick === 0){
          lat = e.latlng.lat;
          lng = e.latlng.lng;
          meetingPointType = 'mapClick';
          let content = document.createElement('div');
          let text = document.createElement('p');
              text.textContent = `Your chosen location: ${e.latlng.lat}, ${e.latlng.lng}`;
              text.style.color = '#000';
              content.appendChild(text);
          let button = document.createElement('button');
              button.classList.add('.btngreen');
              button.textContent = `Save this location?`;
              button.addEventListener('click', function(){
                save();
              });
              content.appendChild(button);

           //<button class='btngreen'>Save this location?</button>;



          if(circle){
            radius = parseInt(document.getElementById('trainingradius').value * 1000);
            circle = L.circle({lat: e.latlng.lat, lng: e.latlng.lng }, radius).addTo(map);
          }
          if(swapMarkerparam){
            swapMarker(lat, lng, content);
          }
          //displaytickprev(document.getElementById("trainingAreaHolder"));
          if(save){
            save();
          }
        }
        //altered circle:
        else{
          lat = e.latlng.lat;
          lng = e.latlng.lng;
          text = "Your current location";
          if(circle === true){
            radius = parseInt(document.getElementById('trainingradius').value * 1000);
            circle = L.circle({lat: e.latlng.lat, lng: e.latlng.lng }, radius).addTo(map);
          }
          if(swapMarkerparam === true){
            swapMarker();
          }
          //displaytickprev(document.getElementById("trainingAreaHolder"));
          if(save === true){
            mapfunctions.saveLocation("coordinates", JSON.stringify({lat: e.latlng.lat, lng: e.latlng.lng }));
          }
        }
        if(enableroute){
          route([JSON.parse(baseelem.dataset.coordinates), {lat: e.latlng.lat, lng: e.latlng.lng}]);
        }
      });
      return this;
    }

    this.loadProvidersAndSports = function(sport, cards, link){
      loadProvidersAndSports(sport, cards, link);
      return this;
    };

    this.makeSpecificMarker = function(guideData){
      makeMarkers2(guideData, 0);
    };

    this.loadMarkers = function(provider, service){
      loadMarkers(provider, service);
      return this;
    };

    this.typeDropdown = function(data){
      typeDropdown(data);
      return this;
    };

    var select;
    var option;

    function typeDropdown(data){
      var servicesAr = [];

      if(typeof data === 'string'){
        data = JSON.parse(data);
      }

      if(typeDropdownOption === false){
        select = document.createElement('select');
        select.classList.add('rentalTypeSelect');
        buttonBase.append(select);

        option = document.createElement('option');
        option.setAttribute('disabled', true);
        option.setAttribute('selected', true);
        option.textContent = 'Select activity type:';
        select.appendChild(option);

        typeDropdownOption = true;
        makeOptions(data);

      }
      else{
        while(select.children.length > 1){
          select.removeChild(select.lastChild);
        }

        makeOptions(data);
      }

      function makeOptions(data){
        data.forEach(function(r){
          r.data.services.forEach(function(e){

            if(servicesAr.includes(e) === false){
              var optionNew = document.createElement('option');
                  optionNew.setAttribute('value', e);
                  optionNew.textContent = e;
                  select.appendChild(optionNew);
                  servicesAr.push(e);
            }
          });
        });
        //attach events
        select.addEventListener('change', function(evt){
          for(var i = madeMarkers.length-1; i >= 0; --i){
            if(evt.target.value === madeMarkers[i].type){
              madeMarkers[i].providerMarkers.forEach(function(e){
                  markers.addLayer(e);
                });
            }else{
              madeMarkers[i].providerMarkers.forEach(function(e){
                  markers.removeLayer(e);
                });
              }
            }
          });
        }

    }


    /**
     * loadMarkers
     * @event loadProvidersAndSports
     * @type {function}
     * @param {Object} guides -An object containing all the information to load markers onto the map
     * @fires hideOrDisplaySportCards
     */
    function loadMarkers(guides){
      var guidesSt;
      if(typeof guides !== 'object'){
         guidesSt = JSON.parse(guides);
      }
      else{
        guidesSt = guides;
      }
      //
      hideOrDisplaySportCards(guidesSt);

      for(var i = 0; i < guidesSt.length; i++){
        //split and make diffent markers for different services by the same provider
        if(guidesSt[i].data.services.length <= 1){

          makeMarkers(guidesSt[i], 0);
        }
        else{
          for(var j = 0; j < guidesSt[i].data.services.length; j++){

            makeMarkers(guidesSt[i], j);
            //see if there is a way to avoid re requesting data for the same area: Storing coords or whatevs
            //mapInst.madeMarkers.push(guidesSt[i].verificationcode + "-" + sport);
          }
        }
        if(i === guidesSt.length-1){
          markers.addTo(map);
          folder2.reattachEvents();
          radiae.addTo(map);
          //loadguides(sport);
          //load guides originally added the guide cards, same thing could be used for suppliers.
        }
      }
      //no marker, wipe the slate:
      if(guidesSt.length === 0){

        markers.clearLayers();
        madeMarkers.length = 0;

        //clearlocalguides(sport);
      }
      //not generic
      function clearlocalguides(sport){
        var text = sport.replace(/-/g, ' ');
        document.getElementById('guidesCard').innerHTML = '<p>No ' + text + ' guides in this area.</p>';
      }

    }

    //not externally exposed functons specifically to be used on the map:
    function attach(elem, eventType){
      elem.addEventListener('click', function(){
        lat = parseFloat(this.dataset.lat);
        lng = parseFloat(this.dataset.lng);
        text = this.textContent;
        enableRoute();
        swapMarker(lat, lng, text, true);
      });
    }

    function enableRoute(){
      if(enableroute){
        route();
      }
    }

    /**
     * loadProvidersAndSports
     * @event loadProvidersAndSports
     * @type {function}
     * @param {string} sport -Sport information being requested, e.g. "cycling-training"
     * @param {boolean} cards -Requests rendered template if true, raw json if false.
     * @param {string} link -Link from which to request information
     * @fires loadMarkers
     */
    function loadProvidersAndSports(sport, cards, link){

      //location-providers
      var bounds = map.getBounds();
      xhr({coordinates: bounds, sport: sport, cards: cards}, link, function(callback){

        if(cards){
          //n.b. note that in the rental template 'guides cards '

          /**
           *@todo disambiguate guidesCard to 'supplierCardCollection'
           */

           /*
            document.getElementById('guidesCard').innerHTML = callback;
            //this is to reduce round trips, print non precious data to template:
            var data = JSON.parse(document.getElementById('guidesCard').firstChild.dataset.guidedata);
          */
          document.getElementById('supplierCardCollection').innerHTML = callback;
          //this is to reduce round trips, print non precious data to template:
          if(document.getElementById('supplierCardCollection').firstChild.dataset.supplierdata){
            var data = JSON.parse(document.getElementById('supplierCardCollection').firstChild.dataset.supplierdata);
            //load the data in the template like guides app.
            loadMarkers(data, sport);

            typeDropdown(data);

            //See comment on line 178 re. initializeCards
            //initializeCards();
          }
          else{
            typeDropdown([]);
          }
        }

        else {

          loadMarkers(callback, sport);
          typeDropdown(callback);
        }
      });
    }

    /**
     * @function mapEvents
     */
    function mapEvents(sport, cards, link){
      /**
       * @fires loadProvidersAndSports on map move end, 'moveend'.
       */
      map.on('load', function(e) {

        loadProvidersAndSports(sport, cards, link);
      });

      map.on('moveend', function(e) {
        //if the map is visible:

        loadProvidersAndSports(sport, cards, link);
        if(map.offsetWidth > 0 && map.offsetHeight > 0){
        }
      });

      map.on('resize', function(e) {
        //if the map is visible:
        if(map.offsetWidth > 0 && map.offsetHeight > 0){
          loadProvidersAndSports(sport, cards, link);
        }
      });
    }

    function generateRentalPopup(guidesSt, j){

      var div = L.DomUtil.create('div');
      var h3 = L.DomUtil.create('h3');
        h3.textContent = guidesSt.provider;
        div.appendChild(h3);

      var p = L.DomUtil.create('p');
        var service = guidesSt.data.services[j].replace(/-/g, ' ');
        p.textContent = service.charAt(0).toUpperCase() + service.slice(1);
        div.appendChild(p);

      var btn = L.DomUtil.create('button', 'sms2');
        addclasses(btn, ['btn',  'bounceOnHover', 'mapbtn']);
        btn.setAttribute('data-guide', 'card-'+guidesSt.data.verificationcode+'-'+ guidesSt.data.services[j]);
        btn.setAttribute('data-providerCode', guidesSt.data.verificationcode)
        btn.textContent = 'Read more ~';
        div.appendChild(btn);
        btn.addEventListener('click', function(e){

          var url = encodeURI(window.location.origin + '/provider?alias=' + guidesSt.data.alias);
          window.location.replace(url);
        });

      if(guidesSt.data.radius){
        var btn1 = L.DomUtil.create('button', 'sms2');
        btn1.textContent = 'Activity radius';
        addclasses(btn1, ['btn',  'bounceOnHover', 'radius']);
        addradius(btn1, guidesSt);
        div.appendChild(btn1);
      }

      var btn2 = L.DomUtil.create('button', 'sms2');
        btn2.textContent = 'Check route';
        addclasses(btn2, ['btn',  'bounceOnHover', 'checkRoute']);
        btn2.dataset.coordinates = JSON.stringify(guidesSt.coordinates);
        div.appendChild(btn2);

      var btn4;
      //if a provider will travel (how far?)
      if(guidesSt.data.delivery.willtravel === 1){
        btn4 = L.DomUtil.create('button', 'sms2');
        btn4.textContent = 'Delivery Radius';
        addclasses(btn4, ['btn',  'bounceOnHover', 'deliveryRadius']);
        var coordinates = guidesSt.data.delivery['location-decimal-coordinates'];
        var radius = guidesSt.data.delivery.radius;
        btn4.dataset.coordinates = JSON.stringify(coordinates);
        btn4.dataset.radius = radius;
        //like this to match guides formating:
        addradius(btn4, {coordinates: coordinates, data: {radius: radius}});
        div.appendChild(btn4);
      }


      var btn3;
      if(notNext){
        btn3 = L.DomUtil.create('button', 'sms2');
        btn3.textContent = 'next';
        addclasses(btn3, ['btn', 'sms2', 'bounceOnHover', 'bookguideBtn']);

        btn3.dataset.code = guidesSt.data.verificationcode;
        btn3.dataset.sport = guidesSt.data.services[j];
        div.appendChild(btn3);
      }
      else{
        btn3 = L.DomUtil.create('button', 'sms2');
        btn3.textContent = 'next';
        addclasses(btn3, ['btn', 'sms2', 'bounceOnHover', 'btnnext', 'providers', 'hirechoice', 'selectProvider']);
        btn3.dataset.pageid = '1';

        btn3.dataset.provider = guidesSt.provider;
        btn3.dataset.hirechoice = guidesSt.data.services[j];
        div.appendChild(btn3);
      }


      var alert = L.DomUtil.create('div');
        addclasses(alert, ['alertdiv']);
        div.appendChild(alert);

      var p2 = L.DomUtil.create('p');
          p2.textContent = 'Please search for a location to route in the panel above';
          alert.appendChild(p2);
          alert.style.display = 'none';


        btn2.addEventListener('click', function(){
          if(lat === undefined || lng === undefined ){
            alert.style.display = 'block';
          }
          else{
            route([guidesSt.coordinates,{lat: lat, lng: lng}], false, false);
          }
        });

      return div;
    }

    function color(jobType){

      if(jobType === 'race bike rental'){
        return 'blue';
      }
      if(jobType === 'mountain bike rental'){
        return 'green';
      }
    }

    function makeMarkers(guidesSt, count){
      var newDataObject = {};

        if(guidesSt.data.shop.pickup === 1){
          newDataObject.data = JSON.parse(JSON.stringify(guidesSt.data.shop));
          newDataObject.data['location-decimal-coordinates'] = guidesSt.data.shop['location-decimal-coordinates'];
        }
        if(guidesSt.data.shop.pickup === 1 && guidesSt.data.delivery.willtravel === 1){
          newDataObject.data = JSON.parse(JSON.stringify(guidesSt.data));
          newDataObject.data['location-decimal-coordinates'] = guidesSt.data.shop['location-decimal-coordinates'];
        }
        if(guidesSt.data.shop.pickup === 0 && guidesSt.data.delivery.willtravel === 1){
          newDataObject.data = JSON.parse(JSON.stringify(guidesSt.data.delivery));
          newDataObject.data['location-decimal-coordinates'] = guidesSt.data.delivery['location-decimal-coordinates'];
        }

        newDataObject.provider = guidesSt.provider;
        newDataObject.services = guidesSt.data.services;
        newDataObject.verificationcode = guidesSt.data.verificationcode;

      var code = newDataObject.data.verificationcode;
      var service = newDataObject.data.services[count];
      var location = JSON.stringify(newDataObject.data['location-decimal-coordinates'] );
      var reference = code + '-' + service + '-' + location;

      if(madeMarkers.length === 0){
        make();
      }else{
        madeMarkers.find(function(e){
          if(e.type === service){
            return;
          }
          else{
            make();
          }
        });
      }

      function make(){
        if(indexByType.includes(reference) === false){
          //rendering circles to canvas allows more (pseudo)elements to be added.
          var lat = newDataObject.data['location-decimal-coordinates'].lat;
          var lng = newDataObject.data['location-decimal-coordinates'].lng;
                    newDataObject.coordinates = {lat: lat, lng: lng};

          var marker = L.circleMarker(newDataObject.coordinates, {zIndexOffset: 1000, color: color(newDataObject.data.services[count])});
          var popup = marker.bindPopup(L.popup({autoPan : false}).setContent(generateRentalPopup(newDataObject, count))).openPopup();

          //store by type
          madeMarkers.push({type: service, providerMarkers: [marker]});
          // adde to MarkerClusterGroup
          marker.addTo(markers);
          //index to avoid duplicates:
          indexByType.push(reference);
          madeMarkersG = madeMarkers;
        }
      }
    }

    /*This pair of functions (addclasses and addradius) is used in creating the
    guide marker dom elements note that these need to chain product type*/
    function addclasses(el, classArray){
      for(var i = 0; i < classArray.length; i++){
        L.DomUtil.addClass(el, classArray[i]);
      }
    }

    function uniques(arr) {

        var a = [];
        for (var i=0, l=arr.length; i<l; i++)
            if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
                a.push(arr[i]);
        return a;
    }

    function hideOrDisplaySportCards(providers){
      //var providers = JSON.parse(c);

      var servicesBoiledDown = [];
      providers.forEach(function(e, count){
        e.data.services.forEach(function(e){
          servicesBoiledDown.push(e);
        });
        if(count === providers.length -1){

          var divs = document.querySelectorAll('.sportCardContainer');

          divs.forEach(function(e, num){
            e.style.display = 'none';
          });

          var uniqueEl = uniques(servicesBoiledDown);

          uniqueEl.forEach(function(e){

            var el = document.querySelectorAll("[id='"+ e +"']");

            el.forEach(function(p){
              p.style.display = 'block';
            });
          });
        }
      });
    }

    function addradius(btn, guidesSt){
      var clickCount = 1;
      if(!guidesSt.radius){
        guidesSt.radius = 1;
      }
      var radius = addGuideRadius(guidesSt.coordinates, parseInt(guidesSt.data.radius));
      btn.addEventListener('click', function(){

        if(clickCount % 2){
          radius.addTo(radiae);
        }
        else{
          radius.removeFrom(radiae);
        }
        clickCount++;
      });
    }

    function withinRadius(providerCo, mapCo, radius){
      var lat1 = providerCo.lat;
      var lon1 = providerCo.lng;
      var lat2 = mapCo.lat;
      var lon2 = mapCo.lng;

      var R = 6371e3; // metres
      var φ1 = lat1* Math.PI / 180;
      var φ2 = lat2* Math.PI / 180;
      var Δφ = (lat2-lat1)* Math.PI / 180;
      var Δλ = (lon2-lon1)* Math.PI / 180;

      var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      var d = R * c;


      if(d > parseInt(radius) * 1000){

        locationValid = false;
        return false;
      }
      else{

        locationValid = true;
        return true;
      }
    }
}
