// Rivets.js
// version: 1.0.10
// author: Michael Richards
// license: MIT
(function() {
  var Rivets, bindMethod, isProdEnv, unbindMethod, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  isProdEnv = true;

  Rivets = {
    options: ['prefix', 'templateDelimiters', 'rootInterface', 'preloadData', 'handler'],
    extensions: ['binders', 'formatters', 'components', 'adapters'],
    "public": {
      binders: {},
      components: {},
      formatters: {},
      adapters: {},
      prefix: 'rv',
      templateDelimiters: ['{', '}'],
      rootInterface: '.',
      preloadData: true,
      handler: function(context, ev, binding) {
        return this.call(context, ev, binding.view.models);
      },
      configure: function(options) {
        var descriptor, key, option, value;
        if (options == null) {
          options = {};
        }
        for (option in options) {
          value = options[option];
          if (option === 'binders' || option === 'components' || option === 'formatters' || option === 'adapters') {
            for (key in value) {
              descriptor = value[key];
              Rivets[option][key] = descriptor;
            }
          } else {
            Rivets["public"][option] = value;
          }
        }
      },
      bind: function(el, models, options) {
        var view;
        if (models == null) {
          models = {};
        }
        if (options == null) {
          options = {};
        }
        view = new Rivets.View(el, models, options);
        view.bind();
        return view;
      },
      bindAsync: function(el, models, options) {
        var view;
        if (models == null) {
          models = {};
        }
        if (options == null) {
          options = {};
        }
        view = new Rivets.View(el, models, options);
        return view.bindAsync().then(function() {
          return view;
        });
      },
      init: function(component, el, data) {
        var scope, template, view;
        if (data == null) {
          data = {};
        }
        if (el == null) {
          el = document.createElement('div');
        }
        component = Rivets["public"].components[component];
        template = component.template.call(this, el);
        if (template instanceof HTMLElement) {
          while (el.firstChild) {
            el.removeChild(el.firstChild);
          }
          el.appendChild(template);
        } else {
          el.innerHTML = template;
        }
        scope = component.initialize.call(this, el, data);
        view = new Rivets.View(el, scope);
        view.bind();
        return view;
      }
    }
  };

  if (window['jQuery'] || window['$']) {
    _ref = 'on' in jQuery.prototype ? ['on', 'off'] : ['bind', 'unbind'], bindMethod = _ref[0], unbindMethod = _ref[1];
    Rivets.Util = {
      bindEvent: function(el, event, handler) {
        return jQuery(el)[bindMethod](event, handler);
      },
      unbindEvent: function(el, event, handler) {
        return jQuery(el)[unbindMethod](event, handler);
      },
      getInputValue: function(el) {
        var $el;
        $el = jQuery(el);
        if ($el.attr('type') === 'checkbox') {
          return $el.is(':checked');
        } else {
          return $el.val();
        }
      }
    };
  } else {
    Rivets.Util = {
      bindEvent: (function() {
        if ('addEventListener' in window) {
          return function(el, event, handler) {
            return el.addEventListener(event, handler, false);
          };
        }
        return function(el, event, handler) {
          return el.attachEvent('on' + event, handler);
        };
      })(),
      unbindEvent: (function() {
        if ('removeEventListener' in window) {
          return function(el, event, handler) {
            return el.removeEventListener(event, handler, false);
          };
        }
        return function(el, event, handler) {
          return el.detachEvent('on' + event, handler);
        };
      })(),
      getInputValue: function(el) {
        var o, _i, _len, _results;
        if (el.type === 'checkbox') {
          return el.checked;
        } else if (el.type === 'select-multiple') {
          _results = [];
          for (_i = 0, _len = el.length; _i < _len; _i++) {
            o = el[_i];
            if (o.selected) {
              _results.push(o.value);
            }
          }
          return _results;
        } else {
          return el.value;
        }
      },
      isScreenShotMode: function() {
        return Rivets["public"].params && Rivets["public"].params.hasOwnProperty('screenshotMode');
      }
    };
  }

  Rivets.TypeParser = (function() {
    function TypeParser() {}

    TypeParser.types = {
      primitive: 0,
      keypath: 1
    };

    TypeParser.parse = function(string) {
      if (/^'.*'$|^".*"$/.test(string)) {
        return {
          type: this.types.primitive,
          value: string.slice(1, -1)
        };
      } else if (string === 'true') {
        return {
          type: this.types.primitive,
          value: true
        };
      } else if (string === 'false') {
        return {
          type: this.types.primitive,
          value: false
        };
      } else if (string === 'null') {
        return {
          type: this.types.primitive,
          value: null
        };
      } else if (string === 'undefined') {
        return {
          type: this.types.primitive,
          value: void 0
        };
      } else if (isNaN(Number(string)) === false) {
        return {
          type: this.types.primitive,
          value: Number(string)
        };
      } else {
        return {
          type: this.types.keypath,
          value: string
        };
      }
    };

    return TypeParser;

  })();

  Rivets.TextTemplateParser = (function() {
    function TextTemplateParser() {}

    TextTemplateParser.types = {
      text: 0,
      binding: 1
    };

    TextTemplateParser.parse = function(template, delimiters) {
      var index, lastIndex, lastToken, length, substring, tokens, value;
      tokens = [];
      length = template.length;
      index = 0;
      lastIndex = 0;
      while (lastIndex < length) {
        index = template.indexOf(delimiters[0], lastIndex);
        if (index < 0) {
          tokens.push({
            type: this.types.text,
            value: template.slice(lastIndex)
          });
          break;
        } else {
          if (index > 0 && lastIndex < index) {
            tokens.push({
              type: this.types.text,
              value: template.slice(lastIndex, index)
            });
          }
          lastIndex = index + delimiters[0].length;
          index = template.indexOf(delimiters[1], lastIndex);
          if (index < 0) {
            substring = template.slice(lastIndex - delimiters[1].length);
            lastToken = tokens[tokens.length - 1];
            if ((lastToken != null ? lastToken.type : void 0) === this.types.text) {
              lastToken.value += substring;
            } else {
              tokens.push({
                type: this.types.text,
                value: substring
              });
            }
            break;
          }
          value = template.slice(lastIndex, index).trim();
          tokens.push({
            type: this.types.binding,
            value: value
          });
          lastIndex = index + delimiters[1].length;
        }
      }
      return tokens;
    };

    return TextTemplateParser;

  })();

  Rivets.View = (function() {
    function View(els, models, options, parentView) {
      var k, option, v, _base, _i, _j, _len, _len1, _ref1, _ref2, _ref3, _ref4, _ref5;
      this.els = els;
      this.models = models;
      if (options == null) {
        options = {};
      }
      this.parentView = parentView;
      this.update = __bind(this.update, this);
      this.publish = __bind(this.publish, this);
      this.sync = __bind(this.sync, this);
      this.unbind = __bind(this.unbind, this);
      this.bindAsync = __bind(this.bindAsync, this);
      this.bind = __bind(this.bind, this);
      this.select = __bind(this.select, this);
      this.getParentNodeByAttributeValue = __bind(this.getParentNodeByAttributeValue, this);
      this.getParentControllerNode = __bind(this.getParentControllerNode, this);
      this.getParentViewNode = __bind(this.getParentViewNode, this);
      this.getParentView = __bind(this.getParentView, this);
      this.traverse = __bind(this.traverse, this);
      this.build = __bind(this.build, this);
      this.addBinding = __bind(this.addBinding, this);
      this.buildBinding = __bind(this.buildBinding, this);
      this.bindingRegExp = __bind(this.bindingRegExp, this);
      this.options = __bind(this.options, this);
      if (!(this.els.jquery || this.els instanceof Array)) {
        this.els = [this.els];
      }
      _ref1 = Rivets.extensions;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        option = _ref1[_i];
        this[option] = {};
        if (options[option]) {
          _ref2 = options[option];
          for (k in _ref2) {
            v = _ref2[k];
            this[option][k] = v;
          }
        }
        _ref3 = Rivets["public"][option];
        for (k in _ref3) {
          v = _ref3[k];
          if ((_base = this[option])[k] == null) {
            _base[k] = v;
          }
        }
      }
      _ref4 = Rivets.options;
      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
        option = _ref4[_j];
        this[option] = (_ref5 = options[option]) != null ? _ref5 : Rivets["public"][option];
      }
      this.build();
    }

    View.prototype.options = function() {
      var option, options, _i, _len, _ref1;
      options = {};
      _ref1 = Rivets.extensions.concat(Rivets.options);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        option = _ref1[_i];
        options[option] = this[option];
      }
      return options;
    };

    View.prototype.bindingRegExp = function() {
      return new RegExp("^" + this.prefix + "-");
    };

    View.prototype.buildBinding = function(binding, node, type, declaration, targetView) {
      var context, ctx, dependencies, keypath, options, pipe, pipes;
      if (targetView == null) {
        targetView = this;
      }
      options = {};
      pipes = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = declaration.split('|');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          pipe = _ref1[_i];
          _results.push(pipe.trim());
        }
        return _results;
      })();
      context = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = pipes.shift().split('<');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          ctx = _ref1[_i];
          _results.push(ctx.trim());
        }
        return _results;
      })();
      keypath = context.shift();
      options.formatters = pipes;
      if (dependencies = context.shift()) {
        options.dependencies = dependencies.split(/\s+/);
      }
      binding = new Rivets[binding](targetView, node, type, keypath, options);
      this.bindings.push(binding);
      return binding;
    };

    View.prototype.addBinding = function(node, type, declaration) {
      var binding;
      binding = this.buildBinding('Binding', node, type, declaration);
      binding.bind();
      return binding;
    };

    View.prototype.build = function() {
      var el, parse, _i, _len, _ref1;
      this.bindings = [];
      parse = (function(_this) {
        return function(node) {
          var block, childNode, delimiters, n, parser, text, token, tokens, _i, _j, _len, _len1, _ref1, _results;
          if (node.nodeType === 3) {
            parser = Rivets.TextTemplateParser;
            if (delimiters = _this.templateDelimiters) {
              if ((tokens = parser.parse(node.data, delimiters)).length) {
                if (!(tokens.length === 1 && tokens[0].type === parser.types.text)) {
                  for (_i = 0, _len = tokens.length; _i < _len; _i++) {
                    token = tokens[_i];
                    text = document.createTextNode(token.value);
                    node.parentNode.insertBefore(text, node);
                    if (token.type === 1) {
                      _this.buildBinding('TextBinding', text, null, token.value);
                    }
                  }
                  node.parentNode.removeChild(node);
                }
              }
            }
          } else if (node.nodeType === 1) {
            block = _this.traverse(node);
          }
          if (!block) {
            _ref1 = (function() {
              var _k, _len1, _ref1, _results1;
              _ref1 = node.childNodes;
              _results1 = [];
              for (_k = 0, _len1 = _ref1.length; _k < _len1; _k++) {
                n = _ref1[_k];
                _results1.push(n);
              }
              return _results1;
            })();
            _results = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              childNode = _ref1[_j];
              _results.push(parse(childNode));
            }
            return _results;
          }
        };
      })(this);
      _ref1 = this.els;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        el = _ref1[_i];
        parse(el);
      }
      this.bindings.sort(function(a, b) {
        var _ref2, _ref3;
        return (((_ref2 = b.binder) != null ? _ref2.priority : void 0) || 0) - (((_ref3 = a.binder) != null ? _ref3.priority : void 0) || 0);
      });
    };

    View.prototype.traverse = function(node) {
      var attribute, attributes, binder, bindingRegExp, block, blockAttribute, identifier, regexp, targetView, type, value, _i, _j, _len, _len1, _ref1, _ref2, _ref3;
      targetView = this.getParentView(node);
      bindingRegExp = this.bindingRegExp();
      block = node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE';
      _ref1 = node.attributes;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        attribute = _ref1[_i];
        if (bindingRegExp.test(attribute.name)) {
          type = attribute.name.replace(bindingRegExp, '');
          if (!(binder = this.binders[type])) {
            _ref2 = this.binders;
            for (identifier in _ref2) {
              value = _ref2[identifier];
              if (identifier !== '*' && identifier.indexOf('*') !== -1) {
                regexp = new RegExp("^" + (identifier.replace(/\*/g, '.+')) + "$");
                if (regexp.test(type)) {
                  binder = value;
                }
              }
            }
          }
          binder || (binder = this.binders['*']);
          if (binder.block) {
            block = true;
            attributes = [attribute];
          }
        }
      }
      _ref3 = attributes || node.attributes;
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        attribute = _ref3[_j];
        type = attribute.name.replace(bindingRegExp, '');
        blockAttribute = 'block-binding-' + type;
        if (bindingRegExp.test(attribute.name) && !node.hasAttribute(blockAttribute)) {
          this.buildBinding('Binding', node, type, attribute.value, targetView);
        }
      }
      if (!block) {
        type = node.nodeName.toLowerCase();
        if (this.components[type] && !node._bound && !node.hasAttribute('block-binding')) {
          this.bindings.push(new Rivets.ComponentBinding(targetView, node, type));
          block = true;
        }
      }
      return block;
    };

    View.prototype.getParentView = function(node) {
      var parentControllerNode, targetControllerAttributeName, targetControllerId, targetView, targetViewAttributeName, targetViewId, targetViewNode;
      targetView = this;
      targetViewAttributeName = 'parent-view-id';
      targetControllerAttributeName = 'parent-controller-id';
      if (node.hasAttribute(targetViewAttributeName)) {
        targetViewId = node.getAttribute(targetViewAttributeName);
        targetViewNode = this.getParentViewNode(node, targetViewId);
        if (targetViewNode && targetViewNode.model) {
          targetView = targetViewNode.model.view;
        }
      }
      if (node.hasAttribute(targetControllerAttributeName)) {
        targetControllerId = node.getAttribute(targetControllerAttributeName);
        parentControllerNode = this.getParentControllerNode(node, targetControllerId);
        if (parentControllerNode && parentControllerNode.controllerScope) {
          targetView.models = Object.assign(this.models, Object.assign(targetView.models, JSON.parse(JSON.stringify(this.models))));
        }
      }
      return targetView;
    };

    View.prototype.getParentViewNode = function(element, ssrId) {
      return this.getParentNodeByAttributeValue(element, 'view-id', ssrId);
    };

    View.prototype.getParentControllerNode = function(element, parentControllerId) {
      return this.getParentNodeByAttributeValue(element, 'controller-id', parentControllerId);
    };

    View.prototype.getParentNodeByAttributeValue = function(element, atrributeName, atrributeValue) {
      var elementAttributeValue;
      elementAttributeValue = element instanceof HTMLElement && element.getAttribute(atrributeName);
      if (elementAttributeValue === atrributeValue) {
        return element;
      }
      if (element.parentNode) {
        return this.getParentNodeByAttributeValue(element.parentNode, atrributeName, atrributeValue);
      }
    };

    View.prototype.select = function(fn) {
      var binding, _i, _len, _ref1, _results;
      _ref1 = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        binding = _ref1[_i];
        if (fn(binding)) {
          _results.push(binding);
        }
      }
      return _results;
    };

    View.prototype.bind = function() {
      var binding, _i, _len, _ref1, _results;
      _ref1 = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        binding = _ref1[_i];
        _results.push(binding.bind());
      }
      return _results;
    };

    View.prototype.bindAsync = function() {
      return Promise.all(this.bindings.map((function(_this) {
        return function(binding) {
          return binding.bindAsync();
        };
      })(this)));
    };

    View.prototype.unbind = function() {
      var binding, _i, _len, _ref1, _results;
      _ref1 = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        binding = _ref1[_i];
        _results.push(binding.unbind());
      }
      return _results;
    };

    View.prototype.sync = function() {
      var binding, _i, _len, _ref1, _results;
      _ref1 = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        binding = _ref1[_i];
        _results.push(typeof binding.sync === "function" ? binding.sync() : void 0);
      }
      return _results;
    };

    View.prototype.publish = function() {
      var binding, _i, _len, _ref1, _results;
      _ref1 = this.select(function(b) {
        var _ref1;
        return (_ref1 = b.binder) != null ? _ref1.publishes : void 0;
      });
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        binding = _ref1[_i];
        _results.push(binding.publish());
      }
      return _results;
    };

    View.prototype.update = function(models) {
      var binding, key, model, _i, _len, _ref1, _results;
      if (models == null) {
        models = {};
      }
      for (key in models) {
        model = models[key];
        this.models[key] = model;
      }
      _ref1 = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        binding = _ref1[_i];
        _results.push(typeof binding.update === "function" ? binding.update(models) : void 0);
      }
      return _results;
    };

    return View;

  })();

  Rivets.Binding = (function() {
    function Binding(view, el, type, keypath, options) {
      this.view = view;
      this.el = el;
      this.type = type;
      this.keypath = keypath;
      this.options = options != null ? options : {};
      this.getValue = __bind(this.getValue, this);
      this.update = __bind(this.update, this);
      this.unbind = __bind(this.unbind, this);
      this.bindAsync = __bind(this.bindAsync, this);
      this.bind = __bind(this.bind, this);
      this.publish = __bind(this.publish, this);
      this.sync = __bind(this.sync, this);
      this.set = __bind(this.set, this);
      this.eventHandler = __bind(this.eventHandler, this);
      this.formattedValue = __bind(this.formattedValue, this);
      this.parseTarget = __bind(this.parseTarget, this);
      this.observe = __bind(this.observe, this);
      this.setBinder = __bind(this.setBinder, this);
      this.formatters = this.options.formatters || [];
      this.dependencies = [];
      this.formatterObservers = {};
      this.model = void 0;
      this.setBinder();
    }

    Binding.prototype.setBinder = function() {
      var identifier, regexp, value, _ref1;
      if (typeof this.type === 'object') {
        this.binder = this.type;
        return;
      }
      this.binder = this.view.binders[this.type];
      if (!this.binder) {
        _ref1 = this.view.binders;
        for (identifier in _ref1) {
          value = _ref1[identifier];
          if (identifier !== '*' && identifier.indexOf('*') !== -1) {
            regexp = new RegExp("^" + (identifier.replace(/\*/g, '.+')) + "$");
            if (regexp.test(this.type)) {
              this.binder = value;
              this.args = new RegExp("^" + (identifier.replace(/\*/g, '(.+)')) + "$").exec(this.type);
              this.args.shift();
            }
          }
        }
      }
      this.binder || (this.binder = this.view.binders['*']);
      if (this.binder instanceof Function) {
        return this.binder = {
          routine: this.binder
        };
      }
    };

    Binding.prototype.observe = function(obj, keypath, callback) {
      return Rivets.sightglass(obj, keypath, callback, {
        root: this.view.rootInterface,
        adapters: this.view.adapters
      });
    };

    Binding.prototype.parseTarget = function() {
      var token;
      token = Rivets.TypeParser.parse(this.keypath);
      if (token.type === 0) {
        return this.value = token.value;
      } else {
        this.observer = this.observe(this.view.models, this.keypath, this.sync);
        return this.model = this.observer.target;
      }
    };

    Binding.prototype.formattedValue = function(value) {
      var ai, arg, args, fi, formatter, id, observer, processedArgs, _base, _i, _j, _len, _len1, _ref1;
      _ref1 = this.formatters;
      for (fi = _i = 0, _len = _ref1.length; _i < _len; fi = ++_i) {
        formatter = _ref1[fi];
        args = formatter.match(/[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g);
        id = args.shift();
        formatter = this.view.formatters[id];
        args = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = args.length; _j < _len1; _j++) {
            arg = args[_j];
            _results.push(Rivets.TypeParser.parse(arg));
          }
          return _results;
        })();
        processedArgs = [];
        for (ai = _j = 0, _len1 = args.length; _j < _len1; ai = ++_j) {
          arg = args[ai];
          processedArgs.push(arg.type === 0 ? arg.value : ((_base = this.formatterObservers)[fi] || (_base[fi] = {}), !(observer = this.formatterObservers[fi][ai]) ? (observer = this.observe(this.view.models, arg.value, this.sync), this.formatterObservers[fi][ai] = observer) : void 0, observer.value()));
        }
        if ((formatter != null ? formatter.read : void 0) instanceof Function) {
          value = formatter.read.apply(formatter, [value].concat(__slice.call(processedArgs)));
        } else if (formatter instanceof Function) {
          value = formatter.apply(null, [value].concat(__slice.call(processedArgs)));
        }
      }
      return value;
    };

    Binding.prototype.eventHandler = function(fn) {
      var binding, handler;
      handler = (binding = this).view.handler;
      return function(ev) {
        return handler.call(fn, this, ev, binding);
      };
    };

    Binding.prototype.set = function(value) {
      var _ref1;
      value = value instanceof Function && !this.binder["function"] ? this.formattedValue(value.call(this.model)) : this.formattedValue(value);
      this.value = value;
      return (_ref1 = this.binder.routine) != null ? _ref1.call(this, this.el, value) : void 0;
    };

    Binding.prototype.sync = function() {
      var dependency, observer;
      return this.set((function() {
        var _i, _j, _len, _len1, _ref1, _ref2, _ref3;
        if (this.observer) {
          if (this.model !== this.observer.target) {
            _ref1 = this.dependencies;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              observer = _ref1[_i];
              observer.unobserve();
            }
            this.dependencies = [];
            if (((this.model = this.observer.target) != null) && ((_ref2 = this.options.dependencies) != null ? _ref2.length : void 0)) {
              _ref3 = this.options.dependencies;
              for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
                dependency = _ref3[_j];
                observer = this.observe(this.model, dependency, this.sync);
                this.dependencies.push(observer);
              }
            }
          }
          return this.observer.value();
        } else {
          return this.value;
        }
      }).call(this));
    };

    Binding.prototype.publish = function() {
      var args, formatter, id, value, _i, _len, _ref1, _ref2, _ref3;
      if (this.observer) {
        value = this.getValue(this.el);
        _ref1 = this.formatters.slice(0).reverse();
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          formatter = _ref1[_i];
          args = formatter.split(/\s+/);
          id = args.shift();
          if ((_ref2 = this.view.formatters[id]) != null ? _ref2.publish : void 0) {
            value = (_ref3 = this.view.formatters[id]).publish.apply(_ref3, [value].concat(__slice.call(args)));
          } else {
            return;
          }
        }
        return this.observer.setValue(value);
      }
    };

    Binding.prototype.bind = function() {
      var dependency, observer, _i, _len, _ref1, _ref2, _ref3;
      this.parseTarget();
      if ((_ref1 = this.binder.bind) != null) {
        _ref1.call(this, this.el);
      }
      if ((this.model != null) && ((_ref2 = this.options.dependencies) != null ? _ref2.length : void 0)) {
        _ref3 = this.options.dependencies;
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          dependency = _ref3[_i];
          observer = this.observe(this.model, dependency, this.sync);
          this.dependencies.push(observer);
        }
      }
      if (this.view.preloadData) {
        return this.sync();
      }
    };

    Binding.prototype.bindAsync = function() {
      var proceedBind, promise, _ref1;
      this.parseTarget();
      promise = (_ref1 = this.binder.bindAsync) != null ? _ref1.call(this, this.el) : void 0;
      proceedBind = (function(_this) {
        return function() {
          var dependency, observer, _i, _len, _ref2, _ref3;
          if ((_this.model != null) && ((_ref2 = _this.options.dependencies) != null ? _ref2.length : void 0)) {
            _ref3 = _this.options.dependencies;
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
              dependency = _ref3[_i];
              observer = _this.observe(_this.model, dependency, _this.sync);
              _this.dependencies.push(observer);
            }
          }
          if (_this.view.preloadData) {
            return _this.sync();
          }
        };
      })(this);
      if (promise) {
        return promise.then(function() {
          return proceedBind();
        });
      } else {
        return proceedBind();
      }
    };

    Binding.prototype.unbind = function() {
      var ai, args, fi, observer, _i, _len, _ref1, _ref2, _ref3, _ref4;
      if ((_ref1 = this.binder.unbind) != null) {
        _ref1.call(this, this.el);
      }
      if ((_ref2 = this.observer) != null) {
        _ref2.unobserve();
      }
      _ref3 = this.dependencies;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        observer = _ref3[_i];
        observer.unobserve();
      }
      this.dependencies = [];
      _ref4 = this.formatterObservers;
      for (fi in _ref4) {
        args = _ref4[fi];
        for (ai in args) {
          observer = args[ai];
          observer.unobserve();
        }
      }
      return this.formatterObservers = {};
    };

    Binding.prototype.update = function(models) {
      var _ref1, _ref2;
      if (models == null) {
        models = {};
      }
      this.model = (_ref1 = this.observer) != null ? _ref1.target : void 0;
      return (_ref2 = this.binder.update) != null ? _ref2.call(this, models) : void 0;
    };

    Binding.prototype.getValue = function(el) {
      if (this.binder && (this.binder.getValue != null)) {
        return this.binder.getValue.call(this, el);
      } else {
        return Rivets.Util.getInputValue(el);
      }
    };

    return Binding;

  })();

  Rivets.ComponentBinding = (function(_super) {
    __extends(ComponentBinding, _super);

    function ComponentBinding(view, el, type) {
      this.view = view;
      this.el = el;
      this.type = type;
      this.unbind = __bind(this.unbind, this);
      this.isRenderedComponent = __bind(this.isRenderedComponent, this);
      this.updateBinders = __bind(this.updateBinders, this);
      this.bindAsync = __bind(this.bindAsync, this);
      this.bind = __bind(this.bind, this);
      this.insertContent = __bind(this.insertContent, this);
      this.buildComponentContent = __bind(this.buildComponentContent, this);
      this.buildRuntimeComponentTemplateAsync = __bind(this.buildRuntimeComponentTemplateAsync, this);
      this.buildRuntimeComponentTemplate = __bind(this.buildRuntimeComponentTemplate, this);
      this.buildComponentTemplateAsync = __bind(this.buildComponentTemplateAsync, this);
      this.buildComponentTemplate = __bind(this.buildComponentTemplate, this);
      this.buildViewInstanceAsync = __bind(this.buildViewInstanceAsync, this);
      this.buildViewInstance = __bind(this.buildViewInstance, this);
      this.locals = __bind(this.locals, this);
      this.component = this.view.components[this.type];
      this["static"] = {};
      this.binders = {};
      this.upstreamObservers = {};
    }

    ComponentBinding.prototype.sync = function() {};

    ComponentBinding.prototype.update = function() {};

    ComponentBinding.prototype.publish = function() {};

    ComponentBinding.prototype.locals = function() {
      var binder, key, result, value, _ref1, _ref2;
      result = {};
      _ref1 = this["static"];
      for (key in _ref1) {
        value = _ref1[key];
        result[key] = value;
      }
      _ref2 = this.binders;
      for (key in _ref2) {
        binder = _ref2[key];
        result[key] = binder.formattedValue(binder.value);
      }
      return result;
    };

    ComponentBinding.prototype.camelCase = function(string) {
      return string.replace(/-([a-z])/g, function(grouped) {
        return grouped[1].toUpperCase();
      });
    };

    ComponentBinding.prototype.buildViewInstance = function(element, model, options, parentView) {
      var viewInstance;
      viewInstance = new Rivets.View(element, model, options, parentView);
      viewInstance.bind();
      return viewInstance;
    };

    ComponentBinding.prototype.buildViewInstanceAsync = function(element, model, options, parentView) {
      var viewInstance;
      viewInstance = new Rivets.View(element, model, options, parentView);
      return viewInstance.bindAsync().then((function(_this) {
        return function() {
          return viewInstance;
        };
      })(this));
    };

    ComponentBinding.prototype.buildComponentTemplate = function() {
      var componentTemplate, template;
      componentTemplate = document.createElement('div');
      template = this.component.template.call(this);
      if (template instanceof HTMLElement || template instanceof DocumentFragment) {
        componentTemplate.appendChild(template);
      } else {
        componentTemplate.innerHTML = template;
      }
      return componentTemplate;
    };

    ComponentBinding.prototype.buildComponentTemplateAsync = function() {
      var componentTemplate, templatePromise;
      componentTemplate = document.createElement('div');
      templatePromise = this.component.template.call(this, true);
      return templatePromise.then(function(template) {
        if (template instanceof HTMLElement || template instanceof DocumentFragment) {
          componentTemplate.appendChild(template);
        } else {
          componentTemplate.innerHTML = template;
        }
        return componentTemplate;
      });
    };

    ComponentBinding.prototype.buildRuntimeComponentTemplate = function(rootComponentName) {
      var componentTemplate;
      componentTemplate = this.buildComponentTemplate();
      Array.prototype.slice.call(componentTemplate.querySelectorAll('*')).forEach((function(_this) {
        return function(templateNode) {
          return templateNode.setAttribute('runtime-rendering', true);
        };
      })(this));
      return componentTemplate;
    };

    ComponentBinding.prototype.buildRuntimeComponentTemplateAsync = function(rootComponentName) {
      var componentTemplatePromise;
      componentTemplatePromise = this.buildComponentTemplateAsync();
      return componentTemplatePromise.then(function(componentTemplate) {
        Array.prototype.slice.call(componentTemplate.querySelectorAll('*')).forEach((function(_this) {
          return function(templateNode) {};
        })(this), templateNode.setAttribute('runtime-rendering', true));
        return componentTemplate;
      });
    };

    ComponentBinding.prototype.buildComponentContent = function() {
      var componentContent;
      componentContent = document.createDocumentFragment();
      while (this.el.firstChild) {
        componentContent.appendChild(this.el.firstChild);
      }
      return componentContent;
    };

    ComponentBinding.prototype.insertFragment = function(selector) {
      var fragment;
      fragment = document.createDocumentFragment();
      Array.prototype.slice.call(selector, 0).forEach(function(node) {
        return fragment.appendChild(node);
      });
      return fragment;
    };

    ComponentBinding.prototype.insertTemplate = function(componentTemplate) {
      while (componentTemplate.firstChild) {
        this.el.appendChild(componentTemplate.firstChild);
      }
      return this.el.removeChild(componentTemplate);
    };

    ComponentBinding.prototype.insertContent = function(componentTemplate, componentContent) {
      var contentNodes;
      contentNodes = Array.prototype.slice.call(componentTemplate.getElementsByTagName('content'), 0);
      contentNodes.sort(function(content) {
        var _ref1;
        return (_ref1 = content.attributes["select"]) != null ? _ref1 : -{
          1: 1
        };
      }).forEach(function(content) {
        var contentParentNode, selector;
        selector = componentContent.querySelectorAll(content.getAttribute('select'));
        if (selector.length > 0) {
          content.parentNode.insertBefore(this.insertFragment(selector), content);
          return content.parentNode.removeChild(content);
        } else {
          contentParentNode = content.parentNode;
          while (componentContent.firstChild) {
            contentParentNode.insertBefore(componentContent.firstChild, content);
          }
          return contentParentNode.removeChild(content);
        }
      }, this);
      return componentTemplate.children.length && this.insertTemplate(componentTemplate);
    };

    ComponentBinding.prototype.buildLocalScope = function() {
      if (typeof this.component.initialize === 'function') {
        return this.component.initialize.call(this, this.el, this.locals());
      }
      return {};
    };

    ComponentBinding.prototype.buildComponentView = function(el, model, options, parentView) {
      if (!this.component.block) {
        return this.buildViewInstance(el, model, options, parentView);
      }
      return this.view;
    };

    ComponentBinding.prototype.buildComponentViewAsync = function(el, model, options, parentView) {
      if (!this.component.block) {
        return this.buildViewInstanceAsync(el, model, options, parentView);
      }
      return Promise.resolve(this.view);
    };

    ComponentBinding.prototype.bind = function() {
      var attribute, bindingRegExp, componentContent, componentTemplate, k, option, options, propertyName, scope, v, _base, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if (this.componentView != null) {
        this.componentView.bind();
        if (this.templateView != null) {
          return this.templateView.bind();
        }
      } else {
        this.el._bound = true;
        options = {};
        _ref1 = Rivets.extensions;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          option = _ref1[_i];
          options[option] = {};
          if (this.component[option]) {
            _ref2 = this.component[option];
            for (k in _ref2) {
              v = _ref2[k];
              options[option][k] = v;
            }
          }
          _ref3 = this.view[option];
          for (k in _ref3) {
            v = _ref3[k];
            if ((_base = options[option])[k] == null) {
              _base[k] = v;
            }
          }
        }
        _ref4 = Rivets.options;
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          option = _ref4[_j];
          options[option] = (_ref5 = this.component[option]) != null ? _ref5 : this.view[option];
        }
        bindingRegExp = this.view.bindingRegExp();
        _ref6 = this.el.attributes || [];
        for (_k = 0, _len2 = _ref6.length; _k < _len2; _k++) {
          attribute = _ref6[_k];
          if (!bindingRegExp.test(attribute.name) && attribute.value) {
            propertyName = this.camelCase(attribute.name);
            if (__indexOf.call((_ref7 = this.component["static"]) != null ? _ref7 : [], propertyName) >= 0) {
              this["static"][propertyName] = attribute.value;
            } else {
              this.binders[propertyName] = attribute.value;
            }
          }
        }
        if (!this.bound) {
          Object.keys(this.binders).forEach((function(_this) {
            return function(key) {
              var binder;
              binder = {
                routine: function(el, value) {
                  return typeof scope !== "undefined" && scope !== null ? scope[key] = value : void 0;
                },
                getValue: function() {
                  return typeof scope !== "undefined" && scope !== null ? scope[key] : void 0;
                }
              };
              return _this.binders[key] = _this.view.addBinding(null, binder, _this.binders[key]);
            };
          })(this));
          this.bound = true;
        }
        if (isProdEnv && this.isRenderedComponent()) {
          scope = this.buildLocalScope();
          this.componentView = this.buildComponentView(Array.prototype.slice.call(this.el.childNodes), scope, options, this.view);
          if (typeof scope.ready === "function") {
            scope.ready(this.componentView);
          }
        } else {
          if (isProdEnv) {
            componentTemplate = this.buildRuntimeComponentTemplate();
          } else {
            componentTemplate = this.buildComponentTemplate();
          }
          componentContent = this.buildComponentContent();
          this.componentView = this.buildComponentView(componentContent, this.view.models, options);
          this.el.appendChild(componentTemplate);
          scope = this.buildLocalScope();
          this.templateView = this.buildViewInstance(componentTemplate, scope, options);
          this.insertContent(componentTemplate, componentContent);
          if (typeof scope.ready === "function") {
            scope.ready(this.templateView ? this.templateView : {});
          }
        }
        return this.updateBinders(scope);
      }
    };

    ComponentBinding.prototype.bindAsync = function() {
      var attribute, bindingRegExp, componentTemplatePromise, componentViewPromise, k, option, options, propertyName, scope, v, _base, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if (this.componentView != null) {
        return this.componentView.bindAsync().then((function(_this) {
          return function() {
            if (_this.templateView != null) {
              return _this.templateView.bindAsync();
            }
          };
        })(this));
      } else {
        this.el._bound = true;
        options = {};
        _ref1 = Rivets.extensions;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          option = _ref1[_i];
          options[option] = {};
          if (this.component[option]) {
            _ref2 = this.component[option];
            for (k in _ref2) {
              v = _ref2[k];
              options[option][k] = v;
            }
          }
          _ref3 = this.view[option];
          for (k in _ref3) {
            v = _ref3[k];
            if ((_base = options[option])[k] == null) {
              _base[k] = v;
            }
          }
        }
        _ref4 = Rivets.options;
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          option = _ref4[_j];
          options[option] = (_ref5 = this.component[option]) != null ? _ref5 : this.view[option];
        }
        bindingRegExp = this.view.bindingRegExp();
        _ref6 = this.el.attributes || [];
        for (_k = 0, _len2 = _ref6.length; _k < _len2; _k++) {
          attribute = _ref6[_k];
          if (!bindingRegExp.test(attribute.name) && attribute.value) {
            propertyName = this.camelCase(attribute.name);
            if (__indexOf.call((_ref7 = this.component["static"]) != null ? _ref7 : [], propertyName) >= 0) {
              this["static"][propertyName] = attribute.value;
            } else {
              this.binders[propertyName] = attribute.value;
            }
          }
        }
        if (!this.bound) {
          Object.keys(this.binders).forEach((function(_this) {
            return function(key) {
              var binder;
              binder = {
                routine: function(el, value) {
                  return typeof scope !== "undefined" && scope !== null ? scope[key] = value : void 0;
                },
                getValue: function() {
                  return typeof scope !== "undefined" && scope !== null ? scope[key] : void 0;
                }
              };
              return _this.binders[key] = _this.view.addBinding(null, binder, _this.binders[key]);
            };
          })(this));
          this.bound = true;
        }
        if (isProdEnv && this.isRenderedComponent()) {
          scope = this.buildLocalScope();
          componentViewPromise = this.buildComponentViewAsync(Array.prototype.slice.call(this.el.childNodes), scope, options, this.view);
          return componentViewPromise.then((function(_this) {
            return function(componentView) {
              _this.componentView = componentView;
              if (typeof scope.ready === "function") {
                scope.ready(_this.componentView);
              }
              return _this.updateBinders(scope);
            };
          })(this));
        } else {
          if (isProdEnv) {
            componentTemplatePromise = this.buildRuntimeComponentTemplateAsync();
          } else {
            componentTemplatePromise = this.buildComponentTemplateAsync();
          }
          return componentTemplatePromise.then((function(_this) {
            return function(componentTemplate) {
              var componentContent;
              componentContent = _this.buildComponentContent();
              componentViewPromise = _this.buildComponentViewAsync(componentContent, _this.view.models, options);
              return componentViewPromise.then(function(componentView) {
                var templateViewPromise;
                _this.componentView = componentView;
                _this.el.appendChild(componentTemplate);
                scope = _this.buildLocalScope();
                templateViewPromise = _this.buildViewInstanceAsync(componentTemplate, scope, options);
                return templateViewPromise.then(function(templateView) {
                  _this.templateView = templateView;
                  _this.insertContent(componentTemplate, componentContent);
                  if (typeof scope.ready === "function") {
                    scope.ready(_this.templateView ? _this.templateView : {});
                  }
                  return _this.updateBinders(scope);
                });
              });
            };
          })(this));
        }
      }
    };

    ComponentBinding.prototype.updateBinders = function(scope) {
      var binder, key, _ref1, _results;
      _ref1 = this.binders;
      _results = [];
      for (key in _ref1) {
        binder = _ref1[key];
        _results.push(this.upstreamObservers[key] = this.observe(scope, key, ((function(_this) {
          return function(key, binder) {
            return function() {
              var _ref2;
              if (typeof ((_ref2 = binder.observer) != null ? _ref2.value() : void 0) !== 'function') {
                return binder.publish();
              }
            };
          };
        })(this)).call(this, key, binder)));
      }
      return _results;
    };

    ComponentBinding.prototype.isRenderedComponent = function() {
      return !this.el.hasAttribute('runtime-rendering');
    };

    ComponentBinding.prototype.unbind = function() {
      var binder, key, observer, _ref1, _ref2, _ref3, _ref4, _ref5;
      _ref1 = this.upstreamObservers;
      for (key in _ref1) {
        observer = _ref1[key];
        observer.unobserve();
      }
      _ref2 = this.binders;
      for (key in _ref2) {
        binder = _ref2[key];
        binder.unbind();
      }
      if ((_ref3 = this.component.unbind) != null) {
        _ref3.call(this);
      }
      if (!this.component.block) {
        if ((_ref4 = this.componentView) != null) {
          _ref4.unbind.call(this);
        }
      }
      return (_ref5 = this.templateView) != null ? _ref5.unbind.call(this) : void 0;
    };

    return ComponentBinding;

  })(Rivets.Binding);

  Rivets.TextBinding = (function(_super) {
    __extends(TextBinding, _super);

    function TextBinding(view, el, type, keypath, options) {
      this.view = view;
      this.el = el;
      this.type = type;
      this.keypath = keypath;
      this.options = options != null ? options : {};
      this.sync = __bind(this.sync, this);
      this.formatters = this.options.formatters || [];
      this.dependencies = [];
      this.formatterObservers = {};
    }

    TextBinding.prototype.binder = {
      routine: function(node, value) {
        return node.data = value != null ? value : '';
      }
    };

    TextBinding.prototype.sync = function() {
      return TextBinding.__super__.sync.apply(this, arguments);
    };

    return TextBinding;

  })(Rivets.Binding);

  Rivets["public"].binders.text = function(el, value) {
    if (el.textContent != null) {
      return el.textContent = value != null ? value : '';
    } else {
      return el.innerText = value != null ? value : '';
    }
  };

  Rivets["public"].binders.html = function(el, value) {
    return el.innerHTML = value != null ? value : '';
  };

  Rivets["public"].binders.show = function(el, value) {
    return el.style.display = value ? '' : 'none';
  };

  Rivets["public"].binders.hide = function(el, value) {
    return el.style.display = value ? 'none' : '';
  };

  Rivets["public"].binders.enabled = function(el, value) {
    return el.disabled = !value;
  };

  Rivets["public"].binders.disabled = function(el, value) {
    return el.disabled = !!value;
  };

  Rivets["public"].binders.checked = {
    publishes: true,
    priority: 2000,
    bind: function(el) {
      return Rivets.Util.bindEvent(el, 'change', this.publish);
    },
    unbind: function(el) {
      return Rivets.Util.unbindEvent(el, 'change', this.publish);
    },
    routine: function(el, value) {
      var _ref1;
      if (el.type === 'radio') {
        return el.checked = ((_ref1 = el.value) != null ? _ref1.toString() : void 0) === (value != null ? value.toString() : void 0);
      } else {
        return el.checked = !!value;
      }
    }
  };

  Rivets["public"].binders.unchecked = {
    publishes: true,
    priority: 2000,
    bind: function(el) {
      return Rivets.Util.bindEvent(el, 'change', this.publish);
    },
    unbind: function(el) {
      return Rivets.Util.unbindEvent(el, 'change', this.publish);
    },
    routine: function(el, value) {
      var _ref1;
      if (el.type === 'radio') {
        return el.checked = ((_ref1 = el.value) != null ? _ref1.toString() : void 0) !== (value != null ? value.toString() : void 0);
      } else {
        return el.checked = !value;
      }
    }
  };

  Rivets["public"].binders.value = {
    publishes: true,
    priority: 3000,
    bind: function(el) {
      return Rivets.Util.bindEvent(el, 'change', this.publish);
    },
    unbind: function(el) {
      return Rivets.Util.unbindEvent(el, 'change', this.publish);
    },
    routine: function(el, value) {
      var o, _i, _len, _ref1, _ref2, _ref3, _results;
      if (window.jQuery != null) {
        el = jQuery(el);
        if ((value != null ? value.toString() : void 0) !== ((_ref1 = el.val()) != null ? _ref1.toString() : void 0)) {
          return el.val(value != null ? value : '');
        }
      } else {
        if (el.type === 'select-multiple') {
          if (value != null) {
            _results = [];
            for (_i = 0, _len = el.length; _i < _len; _i++) {
              o = el[_i];
              _results.push(o.selected = (_ref2 = o.value, __indexOf.call(value, _ref2) >= 0));
            }
            return _results;
          }
        } else if ((value != null ? value.toString() : void 0) !== ((_ref3 = el.value) != null ? _ref3.toString() : void 0)) {
          return el.value = value != null ? value : '';
        }
      }
    }
  };

  Rivets["public"].binders["if"] = {
    block: true,
    priority: 4000,
    bind: function(el) {
      var attr, declaration;
      if (this.marker == null) {
        attr = [this.view.prefix, this.type].join('-').replace('--', '-');
        declaration = el.getAttribute(attr);
        this.marker = document.createComment(" rivets: " + this.type + " " + declaration + " ");
        this.bound = false;
        this.viewBind = false;
        el.removeAttribute(attr);
        el.parentNode.insertBefore(this.marker, el);
        if (Rivets.Util.isScreenShotMode()) {
          this.nested = new Rivets.View(el, this.view.models, this.view.options());
          this.nested.bind();
          this.viewBind = true;
        }
        return el.parentNode.removeChild(el);
      }
    },
    unbind: function() {
      var _ref1;
      this.marker = null;
      if ((_ref1 = this.nested) != null) {
        _ref1.unbind();
      }
      return this.nested = null;
    },
    routine: function(el, value) {
      if (!!value === !this.bound) {
        if (value) {
          if (!this.viewBind) {
            (this.nested || (this.nested = new Rivets.View(el, this.view.models, this.view.options()))).bind();
          }
          this.viewBind = false;
          this.marker.parentNode.insertBefore(el, this.marker.nextSibling);
          return this.bound = true;
        } else {
          el.parentNode.removeChild(el);
          this.nested.unbind();
          return this.bound = false;
        }
      }
    },
    update: function(models) {
      var _ref1;
      return (_ref1 = this.nested) != null ? _ref1.update(models) : void 0;
    }
  };

  Rivets["public"].binders.unless = {
    block: true,
    priority: 4000,
    bind: function(el) {
      return Rivets["public"].binders["if"].bind.call(this, el);
    },
    unbind: function() {
      return Rivets["public"].binders["if"].unbind.call(this);
    },
    routine: function(el, value) {
      return Rivets["public"].binders["if"].routine.call(this, el, !value);
    },
    update: function(models) {
      return Rivets["public"].binders["if"].update.call(this, models);
    }
  };

  Rivets["public"].binders['on-*'] = {
    "function": true,
    priority: 1000,
    unbind: function(el) {
      if (this.handler) {
        return Rivets.Util.unbindEvent(el, this.args[0], this.handler);
      }
    },
    routine: function(el, value) {
      if (this.handler) {
        Rivets.Util.unbindEvent(el, this.args[0], this.handler);
      }
      return Rivets.Util.bindEvent(el, this.args[0], this.handler = this.eventHandler(value));
    }
  };

  Rivets["public"].binders['each-*'] = {
    block: true,
    priority: 4000,
    bind: function(el) {
      var attr, view, _i, _len, _ref1;
      if (this.marker == null) {
        attr = [this.view.prefix, this.type].join('-').replace('--', '-');
        this.marker = document.createComment(" rivets: " + this.type + " ");
        this.iterated = [];
        el.removeAttribute(attr);
        el.parentNode.insertBefore(this.marker, el);
        el.parentNode.removeChild(el);
      } else {
        _ref1 = this.iterated;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          view = _ref1[_i];
          view.bind();
        }
      }
    },
    unbind: function(el) {
      var view, _i, _len, _ref1, _results;
      if (this.iterated != null) {
        _ref1 = this.iterated;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          view = _ref1[_i];
          _results.push(view.unbind());
        }
        return _results;
      }
    },
    routine: function(el, collection) {
      var binding, data, i, index, key, model, modelName, options, previous, template, view, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _ref3, _results;
      modelName = this.args[0];
      collection = collection || [];
      if (this.iterated.length > collection.length) {
        _ref1 = Array(this.iterated.length - collection.length);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          view = this.iterated.pop();
          view.unbind();
          this.marker.parentNode.removeChild(view.els[0]);
        }
      }
      for (index = _j = 0, _len1 = collection.length; _j < _len1; index = ++_j) {
        model = collection[index];
        data = {
          index: index
        };
        data[modelName] = model;
        if (this.iterated[index] == null) {
          _ref2 = this.view.models;
          for (key in _ref2) {
            model = _ref2[key];
            if (data[key] == null) {
              data[key] = model;
            }
          }
          previous = this.iterated.length ? this.iterated[this.iterated.length - 1].els[0] : this.marker;
          options = this.view.options();
          options.preloadData = true;
          template = el.cloneNode(true);
          view = new Rivets.View(template, data, options);
          view.bind();
          this.iterated.push(view);
          this.marker.parentNode.insertBefore(template, previous.nextSibling);
        } else if (this.iterated[index].models[modelName] !== model) {
          this.iterated[index].update(data);
        }
      }
      if (el.nodeName === 'OPTION') {
        _ref3 = this.view.bindings;
        _results = [];
        for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
          binding = _ref3[_k];
          if (binding.el === this.marker.parentNode && binding.type === 'value') {
            _results.push(binding.sync());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    },
    update: function(models) {
      var data, key, model, view, _i, _len, _ref1, _results;
      data = {};
      for (key in models) {
        model = models[key];
        if (key !== this.args[0]) {
          data[key] = model;
        }
      }
      _ref1 = this.iterated;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        view = _ref1[_i];
        _results.push(view.update(data));
      }
      return _results;
    }
  };

  Rivets["public"].binders['class-*'] = function(el, value) {
    var elClass;
    elClass = " " + el.className + " ";
    if (!value === (elClass.indexOf(" " + this.args[0] + " ") !== -1)) {
      return el.className = value ? "" + el.className + " " + this.args[0] : elClass.replace(" " + this.args[0] + " ", ' ').trim();
    }
  };

  Rivets["public"].binders['*'] = function(el, value) {
    if (value != null) {
      return el.setAttribute(this.type, value);
    } else {
      return el.removeAttribute(this.type);
    }
  };

  Rivets["public"].adapters['.'] = {
    id: '_rv',
    counter: 0,
    weakmap: {},
    weakReference: function(obj) {
      var id, _base, _name;
      if (!obj.hasOwnProperty(this.id)) {
        id = this.counter++;
        Object.defineProperty(obj, this.id, {
          value: id
        });
      }
      return (_base = this.weakmap)[_name = obj[this.id]] || (_base[_name] = {
        callbacks: {}
      });
    },
    cleanupWeakReference: function(ref, id) {
      if (!Object.keys(ref.callbacks).length) {
        if (!(ref.pointers && Object.keys(ref.pointers).length)) {
          return delete this.weakmap[id];
        }
      }
    },
    stubFunction: function(obj, fn) {
      var map, original, weakmap;
      original = obj[fn];
      map = this.weakReference(obj);
      weakmap = this.weakmap;
      return obj[fn] = function() {
        var callback, k, r, response, _i, _len, _ref1, _ref2, _ref3, _ref4;
        response = original.apply(obj, arguments);
        _ref1 = map.pointers;
        for (r in _ref1) {
          k = _ref1[r];
          _ref4 = (_ref2 = (_ref3 = weakmap[r]) != null ? _ref3.callbacks[k] : void 0) != null ? _ref2 : [];
          for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
            callback = _ref4[_i];
            callback();
          }
        }
        return response;
      };
    },
    observeMutations: function(obj, ref, keypath) {
      var fn, functions, map, _base, _i, _len;
      if (Array.isArray(obj)) {
        map = this.weakReference(obj);
        if (map.pointers == null) {
          map.pointers = {};
          functions = ['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'];
          for (_i = 0, _len = functions.length; _i < _len; _i++) {
            fn = functions[_i];
            this.stubFunction(obj, fn);
          }
        }
        if ((_base = map.pointers)[ref] == null) {
          _base[ref] = [];
        }
        if (__indexOf.call(map.pointers[ref], keypath) < 0) {
          return map.pointers[ref].push(keypath);
        }
      }
    },
    unobserveMutations: function(obj, ref, keypath) {
      var idx, map, pointers;
      if (Array.isArray(obj) && (obj[this.id] != null)) {
        if (map = this.weakmap[obj[this.id]]) {
          if (pointers = map.pointers[ref]) {
            if ((idx = pointers.indexOf(keypath)) >= 0) {
              pointers.splice(idx, 1);
            }
            if (!pointers.length) {
              delete map.pointers[ref];
            }
            return this.cleanupWeakReference(map, obj[this.id]);
          }
        }
      }
    },
    observe: function(obj, keypath, callback) {
      var callbacks, desc, value;
      callbacks = this.weakReference(obj).callbacks;
      if (callbacks[keypath] == null) {
        callbacks[keypath] = [];
        desc = Object.getOwnPropertyDescriptor(obj, keypath);
        if (!((desc != null ? desc.get : void 0) || (desc != null ? desc.set : void 0))) {
          value = obj[keypath];
          Object.defineProperty(obj, keypath, {
            enumerable: true,
            get: function() {
              return value;
            },
            set: (function(_this) {
              return function(newValue) {
                var map, _i, _len, _ref1;
                if (newValue !== value) {
                  _this.unobserveMutations(value, obj[_this.id], keypath);
                  value = newValue;
                  if (map = _this.weakmap[obj[_this.id]]) {
                    callbacks = map.callbacks;
                    if (callbacks[keypath]) {
                      _ref1 = callbacks[keypath].slice();
                      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                        callback = _ref1[_i];
                        if (__indexOf.call(callbacks[keypath], callback) >= 0) {
                          callback(keypath);
                        }
                      }
                    }
                    return _this.observeMutations(newValue, obj[_this.id], keypath);
                  }
                }
              };
            })(this)
          });
        }
      }
      if (__indexOf.call(callbacks[keypath], callback) < 0) {
        callbacks[keypath].push(callback);
      }
      return this.observeMutations(obj[keypath], obj[this.id], keypath);
    },
    unobserve: function(obj, keypath, callback) {
      var callbacks, idx, map;
      if (map = this.weakmap[obj[this.id]]) {
        if (callbacks = map.callbacks[keypath]) {
          if ((idx = callbacks.indexOf(callback)) >= 0) {
            callbacks.splice(idx, 1);
            if (!callbacks.length) {
              delete map.callbacks[keypath];
            }
          }
          this.unobserveMutations(obj[keypath], obj[this.id], keypath);
          return this.cleanupWeakReference(map, obj[this.id]);
        }
      }
    },
    get: function(obj, keypath) {
      return obj[keypath];
    },
    set: function(obj, keypath, value) {
      return obj[keypath] = value;
    }
  };

  Rivets.factory = function(sightglass) {
    Rivets.sightglass = sightglass;
    Rivets["public"]._ = Rivets;
    return Rivets["public"];
  };

  if (typeof (typeof module !== "undefined" && module !== null ? module.exports : void 0) === 'object') {
    module.exports = Rivets.factory(require('sightglass'));
  } else if (typeof define === 'function' && define.amd) {
    define(['sightglass'], function(sightglass) {
      return this.rivets = Rivets.factory(sightglass);
    });
  } else {
    this.rivets = Rivets.factory(sightglass);
  }

}).call(this);
