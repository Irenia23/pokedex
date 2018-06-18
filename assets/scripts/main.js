/* ========================================================================
 * DOM-based Routing
 * Based on http://goo.gl/EUTi53 by Paul Irish
 *
 * Only fires on body classes that match. If a body class contains a dash,
 * replace the dash with an underscore when adding it to the object below.
 *
 * .noConflict()
 * The routing is enclosed within an anonymous function so that you can
 * always reference jQuery with $, even when in .noConflict() mode.
 * ======================================================================== */

(function($) {
  // Use this variable to set up the common and page specific functions. If you
  // rename this variable, you will also need to rename the namespace below.
  var Pokedex = {
    // All pages
    'common': {
      init: function() {
        // JavaScript to be fired on all pages
        $(document)
          .on('click', '.js-tab-stats', handlePokemon.showStats)
          .on('click', '.js-tab-abilities', handlePokemon.showAbilities)
          .on('click', '.js-tab-effect', handlePokemon.showTypes);
      },
      finalize: function() {
        // JavaScript to be fired on all pages, after page specific JS is fired
        mercuryUtils.overrideStyles();
        handlePokemon.getStats();
        handlePokemon.getAbilities();
      }
    },
    // Home page
    'home': {
      init: function() {
        // JavaScript to be fired on the home page
      },
      finalize: function() {
        // JavaScript to be fired on the home page, after the init JS
      }
    },
    // About us page, note the change from about-us to about_us.
    'about_us': {
      init: function() {
        // JavaScript to be fired on the about us page
      }
    }
  };

  var mercuryUtils = (function () {
    var overrideStyles = function () {
      var $styleContainers = $('.js-styles');
      var css = '';

      for (var i = 0; i < $styleContainers.length; i++) {
        css += $styleContainers[i].innerHTML;
      }

      if (css !== '') {
        var heads = document.querySelectorAll('head');
        if (heads.length > 0) {
          var node = document.createElement('style');
          node.type = 'text/css';
          node.appendChild(document.createTextNode(css));
          heads[0].appendChild(node);
        }
        for (var j = 0; j < $styleContainers.length; j++) {
          $styleContainers[j].parentNode.removeChild($styleContainers[j]);
        }
      }
    };

    var showCommentForm = function (ev) {
      ev.preventDefault();
      var link = ev.target || ev.srcElement;
      var targetDivSelector = '.js-form-' + (link.dataset.id), targetClassToggle = link.dataset.class;
      $(targetDivSelector).toggle('slow');
    };

    return {
      overrideStyles: overrideStyles,
      showCommentForm: showCommentForm
    };
  })();

  // The routing fires all common scripts, followed by the page specific scripts.
  // Add additional events for more control over timing e.g. a finalize event
  var UTIL = {
    fire: function(func, funcname, args) {
      var fire;
      var namespace = Pokedex;
      funcname = (funcname === undefined) ? 'init' : funcname;
      fire = func !== '';
      fire = fire && namespace[func];
      fire = fire && typeof namespace[func][funcname] === 'function';

      if (fire) {
        namespace[func][funcname](args);
      }
    },
    loadEvents: function() {
      // Fire common init JS
      UTIL.fire('common');

      // Fire page-specific init JS, and then finalize JS
      $.each(document.body.className.replace(/-/g, '_').split(/\s+/), function(i, classnm) {
        UTIL.fire(classnm);
        UTIL.fire(classnm, 'finalize');
      });

      // Fire common finalize JS
      UTIL.fire('common', 'finalize');
    }
  };

  var handlePokemon = (function () {
    
    var arrayStats = [], arrayAbilities = [], arrayTypes = [];

    function makeRequest(url) {
        return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', url);

        request.onload = function () {
          if (request.status == 200) {
            resolve(request.response);
          }
          else {
            reject(Error(request.statusText));
          }
        };
        request.onerror = function () {
          reject(Error("Network Error"));
        };
        request.send();
      });
    }

    var getStats = function() {
      var id = getId();
      var url = 'https://pokeapi.co/api/v2/pokemon/' + id + '/';
      var response = makeRequest(url);

      response.then(function (result) {
        var pokemon = JSON.parse(result);
        pokemon.stats.forEach(function (stat) {
          arrayStats.push({ statName: stat.stat.name.replace("special-", "Sp. "), statBase: stat.base_stat });
        });

        createStats();
      }, function (err) {
        console.log(err);
      });
    };

    var getAbilities = function() {
      var id = getId();
      var url = 'https://pokeapi.co/api/v2/pokemon/' + id + '/';
      var response = makeRequest(url);

      response.then(function (result) {
        var pokemon = JSON.parse(result);

        pokemon.abilities.forEach(function (ability) {
          var response = makeRequest(ability.ability.url);
          response.then(function (result) {
            var abilityInfo = JSON.parse(result);

            abilityInfo.effect_entries.forEach(function (entry) {
              arrayAbilities.push({ name: abilityInfo.name.replace('-', ' '), shortEffect: entry.short_effect});
            });
          }, function (err) {
            console.log(err);
          });
        });
        console.log(arrayAbilities);
        createAbilities();  
      }, function (err) {
        console.log(err);
      });
    };

    function createStats() {
      var container = document.querySelector(".js-stats");
      
      createTable(container);
      arrayStats.forEach(function (stat) {
        document.querySelector(".js-table-stats").innerHTML += '<tr><td>' + stat.statName + '</td><td><div class="progress" style="width:' + (stat.statBase * 2) + 'px;"><span>' + stat.statBase + '</span></div></td></tr>';
      });
    }

    function createAbilities() {
      var container = document.querySelector(".js-abilities");
      
      
      arrayAbilities.forEach(function (ability) {
        container.innerHTML += '<h2>' + ability.name + '</h2><p>' + ability.shortEffect+ '</p>';
      });
    }

    var createTypes = function () {
      container = document.querySelector(".js-types");
      resetContainer(container);  
      container.innerHTML = "Effectiveness";             
    };

    var showStats = function () {
      document.querySelector(".js-abilities").classList.remove('visible');
      document.querySelector(".js-types").classList.remove('visible');
      var container = document.querySelector(".js-stats");
      container.classList.add('visible');
    };

    var showAbilities = function () {
      document.querySelector(".js-stats").classList.remove('visible');
      document.querySelector(".js-types").classList.remove('visible');
      var container = document.querySelector(".js-abilities");
      container.classList.add('visible');
    };

    var showTypes = function () {
      document.querySelector(".js-stats").classList.remove('show');
      document.querySelector(".js-abilities").classList.remove('show');
      var container = document.querySelector(".js-types");
      container.classList.add('visible');
    };

    // function resetContainer(container) {
    //   container.innerHTML = "";
    // };

    function createTable (parent) {
      table = document.createElement("TABLE");
      table.className = "js-table-stats";
      parent.appendChild(table);
    }

    function getId() {
      return document.querySelector('.js-id-pokemon').getAttribute("data-id");
    }

    return {
      getStats: getStats,
      getAbilities: getAbilities,
      showStats: showStats,
      showAbilities: showAbilities,
      showTypes: showTypes
    };
  })();

  var mercuryPosts = (function () {
    var showCommentForm = function (ev) {
      ev.preventDefault();
      var link = ev.target || ev.srcElement;
      var targetDivSelector = '.js-form-'+(link.dataset.id), targetClassToggle = link.dataset.class;
      $(targetDivSelector).toggle('slow');
    };
    return {
      showCommentForm: showCommentForm
    };
  })();

  // Load Events
  $(document).ready(UTIL.loadEvents);

})(jQuery); // Fully reference jQuery after this point.
