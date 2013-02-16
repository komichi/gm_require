// GM_require.js
//
// A JavaScript dynamic loader for use with GreaseMonkey;
// based loosely on: https://github.com/dexgeh/gm-require
// but completely rewritten to behave more like Require.JS
// (instead of CommonJS).

var GM_define, GM_require;
(function() {
  // A rough approximation of Require.JS's define method
  GM_define = function(arg1, arg2)
  { // when arg1 is a function, execute it
    // else when arg1 is an object, GM_require each of it's contents
    //      when arg2 is a function, execute it with the results of the above GM_require's
    //      when arg2 is an object, just return it
    var gmRequireReturnVals = [ ];
    console.log('GM_define: starting');
    if      (typeof(arg1) === 'function') return arg1();
    else if (typeof(arg1) === 'object')
      for (var i in arg1) // gather the requested modules
        gmRequireReturnVals.push(GM_require(arg1[i]));
    if (typeof(arg2) === 'function') // call their define() with the modules
      return arg2.apply(this, gmRequireReturnVals);
    else if (typeof(arg2) === 'object') return arg2;
    else console.log('GM_define: malformed arguments');
    return null;
  };

  // A rough approximation of Require.JS's require() method
  // Based on: https://github.com/dexgeh/gm-require
  GM_require = function(moduleName)
  { // if we have the module cached, return it
    // else if we have the source cached, load it and return it
    // else get the url, attempt to get the contents, load it and return it
    // return null on error
    console.log('GM_require(' + moduleName + ')');
    var module = GM_require.moduleCacheGet(moduleName);
    if (module)
    {
      console.log('GM_require: ' + moduleName + ' already loaded');
      return module;
    }
    var moduleSource = GM_require.moduleSourceCacheGet(moduleName);
    if (moduleSource)
    {
      console.log('GM_require: ' + moduleName + ' found in source cache');
      GM_require.moduleCachePut(moduleName, GM_require.loadFromSource(moduleName, moduleSource));
      return GM_require.moduleCacheGet(moduleName);
    }
    console.log('GM_require: attempting source load of ' + moduleName);
    // get the url for the moduleName
    var url = GM_require.getModuleUrl(moduleName);
    console.log('GM_require: requesting url ' + url);
    var res = GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      synchronous: true });
    if (res.status === 200)
    {
      console.log('GM_require: ' + moduleName + ' obtained source');
      var moduleSource = res.responseText;
      GM_require.moduleSourceCachePut(moduleName, moduleSource);
      GM_require.moduleCachePut(moduleName, GM_require.loadFromSource(moduleName, moduleSource));
      return GM_require.moduleCacheGet(moduleName);
    }
    return null;
  };

  // returns a url when given a module path/name
  GM_require.getModuleUrl = function(modulePathName)
  {
    if (! modulePathName)
    { // bail if we have no input
      console.log('GM_require.getUrl: no path name provided!');
      return null;
    }
    // don't add the .js suffix if it was already specified
    var suffix = modulePathName.match(/\.js$/) ? '' : '.js'; // for now we always assume JavaScript
    // if the baseUrl is http.* use it;
    // otherwise use the host/proto of the current page
    var baseHostProto = GM_require.configData.baseUrl.match(/^http/) ?
                        GM_require.configData.baseUrl :
                        GM_require.configData.hostProto + GM_require.configData.baseUrl;
    // if the given module/path name starts with a '/' just use it
    if (modulePathName[0] === '/')
    { // NOTE: we slice off the leading slash
      return baseHostProto + modulePathName.slice(1) + suffix;
    }
    else
    { // if there was no path specified, just return our baseHostProto + their module name
      // else if the module of the given module/path name is in our paths array
      //      replace the module string with the contents of the paths array
      //      otherwise, use the module/path string directly
      var splitArray = modulePathName.split('/');
      var modulePath = splitArray.slice(0,-1).join('/'); // gives all but the last element
      var moduleName = splitArray.slice(-1)[0];   // gives only the last last element
      if (splitArray.length === 1) // if there was no path specified
        return baseHostProto + moduleName + suffix;
      else // if there was a path specified, check it with our paths config data and replace as required
        return GM_require.configData.paths[modulePath] ?
               baseHostProto + GM_require.configData.paths[modulePath] + '/' + moduleName + suffix :
               baseHostProto + modulePath + '/' + moduleName + suffix;
    }
  };

  // default config data
  GM_require.configData =
  {
    hostProto: window.location.href.split(window.location.pathname)[0],
    baseUrl: '/',
    paths: {  }
  };

  // GM_require.config
  // - tries to mimic the behavior of require.config but does not support all features
  // - currently supported options are:
  //   - baseUrl: should be a URL prefix right now (e.g., http://johnlane.aka.amazon.com/glue/)
  //   - paths: suffixes to baseUrl to be tried when loading a module
  //
  // For example:
  //  GM_require.config({
  //    baseUrl: "/another/path",
  //    paths: {
  //      "some": "some/v1.0",
  //      "conf": "conf/v1.1"
  //    }});
  GM_require.config = function(inputConf)
  {
    if (inputConf.baseUrl) GM_require.configData.baseUrl = inputConf.baseUrl;
    if (inputConf.paths)
      for (var pathIndex in inputConf.paths)
        GM_require.configData.paths[pathIndex] = inputConf.paths[pathIndex];
  };

  // Module source cache methods
  GM_require.moduleSourceCache = { };
  GM_require.moduleSourceCacheGet = function(moduleName)
  {
    return GM_require.moduleSourceCache[moduleName];
  };
  GM_require.moduleSourceCachePut = function(moduleName, moduleSource)
  {
    return GM_require.moduleSourceCache[moduleName] = moduleSource;
  };
  GM_require.moduleSourceCacheDelete = function(moduleName)
  {
    return GM_require.moduleSourceCachePut(moduleName, null);
  };

  // Module cache methods
  GM_require.moduleCache = { };
  GM_require.moduleCacheGet = function(moduleName)
  {
    return GM_require.moduleCache[moduleName];
  };
  GM_require.moduleCachePut = function(moduleName, module)
  {
    return GM_require.moduleCache[moduleName] = module;
  };
  GM_require.moduleCacheDelete = function(moduleName)
  {
    return GM_require.moduleCachePut(moduleName, null);
  };

  // Load the module name with the given source;  that is:
  // - evaluate it, if it eval's cleanly, cache its source, return the module
  // - else, return null
  GM_require.loadFromSource = function(moduleName, moduleSource)
  {
    var module = null;
    console.log('GM_require.loadFromSource: evaluating "' + moduleSource + '"');
    // evaluate the module source
    try { module = eval(moduleSource); }
    catch (error)
    {
      console.log('GM_require.loadFromSource: eval of module ' + moduleName + ' failed: ' + error.message);
      return null;
    }
    return module;
  };
})();

