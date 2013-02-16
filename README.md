GM_require
__________

GM_require provides GM_require, GM_define and GM_ functions for use within GreaseMonkey.

You define modules using GM_define and include them using GM_require; configure using GM_require.config.

First check out [RequireJS](http://requirejs.org/ "RequireJS"); the idea is precisely the same.  For example:

*File*: scripts/module3.js

```javascript
GM_define(
  ['scripts/module1', 'scripts/module2'],
  function(Module1, Module2) {
    return function Module3() { 
      // class which does something with Module1 and Module2
    };
  });
```

*File*: myscript.user.js

```javascript
GM_require.config({
  baseUrl: "http://my.site.com/directory/"
});


var Module3 = GM_require('scripts/module3');

// now do something with Module3
```

However, since you cannot access all DOM features while using GM_xmlHttpRequest
(which GM_require must use to obtain module code), you will likely need a
version of GreaseMonkey modified to allow users to manually turn off the
sandbox for certain scripts; see: <http://github.com/komichi/greasemonkey>

