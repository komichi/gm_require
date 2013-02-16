GM_require
__________

GM_require provides GM_require and GM_define functions for use within GreaseMonkey.

You define modules using GM_define and include them using GM_require; configure using GM_require.config.

First check out [RequireJS](http://requirejs.org/ "RequireJS"); the idea is precisely the same.  For example :

File: scripts/structure1.js
```javascript
GM_define(
  [],
  function() {
    return { color: "orange",
             size: "large" };
    };
  });
```

File: scripts/structure2.js
```javascript
GM_define(
  [],
  function() {
    return { color: "blue",
             size: "small" };
    };
  });
```

File: scripts/module1.js
```javascript
GM_define(
  ['scripts/structure1', 'scripts/structure2'],
  function(structure1, structure2) {
    return function() { 
      // class which does something with structure1 and structure2
    };
  });
```

File: myscript.user.js
```javascript
GM_require.config({
  baseUrl: "http://my.site.com/directory/"
});
var Module1 = GM_require('scripts/module1');
// now do something with Module1
```

However, since you cannot access all DOM features while using GM_xmlHttpRequest
(which GM_require must use to obtain module code), you will likely need a
version of GreaseMonkey modified to allow users to manually turn off the
sandbox for certain scripts; see: <http://github.com/komichi/greasemonkey>

