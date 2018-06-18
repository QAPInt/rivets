// Rivets.js
// version: 1.0.9
// author: Michael Richards
// license: MIT
(function() {
  var Rivets, bindMethod, isProdEnv, ref1, unbindMethod,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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
    ref1 = 'on' in jQuery.prototype ? ['on', 'off'] : ['bind', 'unbind'], bindMethod = ref1[0], unbindMethod = ref1[1];
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
        var j, len, o, results;
        if (el.type === 'checkbox') {
          return el.checked;
        } else if (el.type === 'select-multiple') {
          results = [];
          for (j = 0, len = el.length; j < len; j++) {
            o = el[j];
            if (o.selected) {
              results.push(o.value);
            }
          }
          return results;
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
    function View(els, models1, options, parentView1) {
      var base, j, k, l, len, len1, option, ref2, ref3, ref4, ref5, ref6, v;
      this.els = els;
      this.models = models1;
      if (options == null) {
        options = {};
      }
      this.parentView = parentView1;
      this.update = bind(this.update, this);
      this.publish = bind(this.publish, this);
      this.sync = bind(this.sync, this);
      this.unbind = bind(this.unbind, this);
      this.bind = bind(this.bind, this);
      this.select = bind(this.select, this);
      this.getParentNodeByAttributeValue = bind(this.getParentNodeByAttributeValue, this);
      this.getParentControllerNode = bind(this.getParentControllerNode, this);
      this.getParentViewNode = bind(this.getParentViewNode, this);
      this.getParentView = bind(this.getParentView, this);
      this.traverse = bind(this.traverse, this);
      this.build = bind(this.build, this);
      this.addBinding = bind(this.addBinding, this);
      this.buildBinding = bind(this.buildBinding, this);
      this.bindingRegExp = bind(this.bindingRegExp, this);
      this.options = bind(this.options, this);
      if (!(this.els.jquery || this.els instanceof Array)) {
        this.els = [this.els];
      }
      ref2 = Rivets.extensions;
      for (j = 0, len = ref2.length; j < len; j++) {
        option = ref2[j];
        this[option] = {};
        if (options[option]) {
          ref3 = options[option];
          for (k in ref3) {
            v = ref3[k];
            this[option][k] = v;
          }
        }
        ref4 = Rivets["public"][option];
        for (k in ref4) {
          v = ref4[k];
          if ((base = this[option])[k] == null) {
            base[k] = v;
          }
        }
      }
      ref5 = Rivets.options;
      for (l = 0, len1 = ref5.length; l < len1; l++) {
        option = ref5[l];
        this[option] = (ref6 = options[option]) != null ? ref6 : Rivets["public"][option];
      }
      this.build();
    }

    View.prototype.options = function() {
      var j, len, option, options, ref2;
      options = {};
      ref2 = Rivets.extensions.concat(Rivets.options);
      for (j = 0, len = ref2.length; j < len; j++) {
        option = ref2[j];
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
        var j, len, ref2, results;
        ref2 = declaration.split('|');
        results = [];
        for (j = 0, len = ref2.length; j < len; j++) {
          pipe = ref2[j];
          results.push(pipe.trim());
        }
        return results;
      })();
      context = (function() {
        var j, len, ref2, results;
        ref2 = pipes.shift().split('<');
        results = [];
        for (j = 0, len = ref2.length; j < len; j++) {
          ctx = ref2[j];
          results.push(ctx.trim());
        }
        return results;
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
      var el, j, len, parse, ref2;
      this.bindings = [];
      parse = (function(_this) {
        return function(node) {
          var block, childNode, delimiters, j, l, len, len1, n, parser, ref2, results, text, token, tokens;
          if (node.nodeType === 3) {
            parser = Rivets.TextTemplateParser;
            if (delimiters = _this.templateDelimiters) {
              if ((tokens = parser.parse(node.data, delimiters)).length) {
                if (!(tokens.length === 1 && tokens[0].type === parser.types.text)) {
                  for (j = 0, len = tokens.length; j < len; j++) {
                    token = tokens[j];
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
            ref2 = (function() {
              var len1, m, ref2, results1;
              ref2 = node.childNodes;
              results1 = [];
              for (m = 0, len1 = ref2.length; m < len1; m++) {
                n = ref2[m];
                results1.push(n);
              }
              return results1;
            })();
            results = [];
            for (l = 0, len1 = ref2.length; l < len1; l++) {
              childNode = ref2[l];
              results.push(parse(childNode));
            }
            return results;
          }
        };
      })(this);
      ref2 = this.els;
      for (j = 0, len = ref2.length; j < len; j++) {
        el = ref2[j];
        parse(el);
      }
      this.bindings.sort(function(a, b) {
        var ref3, ref4;
        return (((ref3 = b.binder) != null ? ref3.priority : void 0) || 0) - (((ref4 = a.binder) != null ? ref4.priority : void 0) || 0);
      });
    };

    View.prototype.traverse = function(node) {
      var attribute, attributes, binder, bindingRegExp, block, blockAttribute, identifier, j, l, len, len1, ref2, ref3, ref4, regexp, targetView, type, value;
      targetView = this.getParentView(node);
      bindingRegExp = this.bindingRegExp();
      block = node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE';
      ref2 = node.attributes;
      for (j = 0, len = ref2.length; j < len; j++) {
        attribute = ref2[j];
        if (bindingRegExp.test(attribute.name)) {
          type = attribute.name.replace(bindingRegExp, '');
          if (!(binder = this.binders[type])) {
            ref3 = this.binders;
            for (identifier in ref3) {
              value = ref3[identifier];
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
      ref4 = attributes || node.attributes;
      for (l = 0, len1 = ref4.length; l < len1; l++) {
        attribute = ref4[l];
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
      var binding, j, len, ref2, results;
      ref2 = this.bindings;
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        binding = ref2[j];
        if (fn(binding)) {
          results.push(binding);
        }
      }
      return results;
    };

    View.prototype.bind = function() {
      var binding, j, len, ref2, results;
      ref2 = this.bindings;
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        binding = ref2[j];
        results.push(binding.bind());
      }
      return results;
    };

    View.prototype.unbind = function() {
      var binding, j, len, ref2, results;
      ref2 = this.bindings;
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        binding = ref2[j];
        results.push(binding.unbind());
      }
      return results;
    };

    View.prototype.sync = function() {
      var binding, j, len, ref2, results;
      ref2 = this.bindings;
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        binding = ref2[j];
        results.push(typeof binding.sync === "function" ? binding.sync() : void 0);
      }
      return results;
    };

    View.prototype.publish = function() {
      var binding, j, len, ref2, results;
      ref2 = this.select(function(b) {
        var ref2;
        return (ref2 = b.binder) != null ? ref2.publishes : void 0;
      });
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        binding = ref2[j];
        results.push(binding.publish());
      }
      return results;
    };

    View.prototype.update = function(models) {
      var binding, j, key, len, model, ref2, results;
      if (models == null) {
        models = {};
      }
      for (key in models) {
        model = models[key];
        this.models[key] = model;
      }
      ref2 = this.bindings;
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        binding = ref2[j];
        results.push(typeof binding.update === "function" ? binding.update(models) : void 0);
      }
      return results;
    };

    return View;

  })();

  Rivets.Binding = (function() {
    function Binding(view1, el1, type1, keypath1, options1) {
      this.view = view1;
      this.el = el1;
      this.type = type1;
      this.keypath = keypath1;
      this.options = options1 != null ? options1 : {};
      this.getValue = bind(this.getValue, this);
      this.update = bind(this.update, this);
      this.unbind = bind(this.unbind, this);
      this.bind = bind(this.bind, this);
      this.publish = bind(this.publish, this);
      this.sync = bind(this.sync, this);
      this.set = bind(this.set, this);
      this.eventHandler = bind(this.eventHandler, this);
      this.formattedValue = bind(this.formattedValue, this);
      this.parseTarget = bind(this.parseTarget, this);
      this.observe = bind(this.observe, this);
      this.setBinder = bind(this.setBinder, this);
      this.formatters = this.options.formatters || [];
      this.dependencies = [];
      this.formatterObservers = {};
      this.model = void 0;
      this.setBinder();
    }

    Binding.prototype.setBinder = function() {
      var identifier, ref2, regexp, value;
      if (typeof this.type === 'object') {
        this.binder = this.type;
        return;
      }
      this.binder = this.view.binders[this.type];
      if (!this.binder) {
        ref2 = this.view.binders;
        for (identifier in ref2) {
          value = ref2[identifier];
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
      var ai, arg, args, base, fi, formatter, id, j, l, len, len1, observer, processedArgs, ref2;
      ref2 = this.formatters;
      for (fi = j = 0, len = ref2.length; j < len; fi = ++j) {
        formatter = ref2[fi];
        args = formatter.match(/[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g);
        id = args.shift();
        formatter = this.view.formatters[id];
        args = (function() {
          var l, len1, results;
          results = [];
          for (l = 0, len1 = args.length; l < len1; l++) {
            arg = args[l];
            results.push(Rivets.TypeParser.parse(arg));
          }
          return results;
        })();
        processedArgs = [];
        for (ai = l = 0, len1 = args.length; l < len1; ai = ++l) {
          arg = args[ai];
          processedArgs.push(arg.type === 0 ? arg.value : ((base = this.formatterObservers)[fi] || (base[fi] = {}), !(observer = this.formatterObservers[fi][ai]) ? (observer = this.observe(this.view.models, arg.value, this.sync), this.formatterObservers[fi][ai] = observer) : void 0, observer.value()));
        }
        if ((formatter != null ? formatter.read : void 0) instanceof Function) {
          value = formatter.read.apply(formatter, [value].concat(slice.call(processedArgs)));
        } else if (formatter instanceof Function) {
          value = formatter.apply(null, [value].concat(slice.call(processedArgs)));
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
      var ref2;
      value = value instanceof Function && !this.binder["function"] ? this.formattedValue(value.call(this.model)) : this.formattedValue(value);
      this.value = value;
      return (ref2 = this.binder.routine) != null ? ref2.call(this, this.el, value) : void 0;
    };

    Binding.prototype.sync = function() {
      var dependency, observer;
      return this.set((function() {
        var j, l, len, len1, ref2, ref3, ref4;
        if (this.observer) {
          if (this.model !== this.observer.target) {
            ref2 = this.dependencies;
            for (j = 0, len = ref2.length; j < len; j++) {
              observer = ref2[j];
              observer.unobserve();
            }
            this.dependencies = [];
            if (((this.model = this.observer.target) != null) && ((ref3 = this.options.dependencies) != null ? ref3.length : void 0)) {
              ref4 = this.options.dependencies;
              for (l = 0, len1 = ref4.length; l < len1; l++) {
                dependency = ref4[l];
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
      var args, formatter, id, j, len, ref2, ref3, ref4, value;
      if (this.observer) {
        value = this.getValue(this.el);
        ref2 = this.formatters.slice(0).reverse();
        for (j = 0, len = ref2.length; j < len; j++) {
          formatter = ref2[j];
          args = formatter.split(/\s+/);
          id = args.shift();
          if ((ref3 = this.view.formatters[id]) != null ? ref3.publish : void 0) {
            value = (ref4 = this.view.formatters[id]).publish.apply(ref4, [value].concat(slice.call(args)));
          } else {
            return;
          }
        }
        return this.observer.setValue(value);
      }
    };

    Binding.prototype.bind = function() {
      var dependency, j, len, observer, ref2, ref3, ref4;
      this.parseTarget();
      if ((ref2 = this.binder.bind) != null) {
        ref2.call(this, this.el);
      }
      if ((this.model != null) && ((ref3 = this.options.dependencies) != null ? ref3.length : void 0)) {
        ref4 = this.options.dependencies;
        for (j = 0, len = ref4.length; j < len; j++) {
          dependency = ref4[j];
          observer = this.observe(this.model, dependency, this.sync);
          this.dependencies.push(observer);
        }
      }
      if (this.view.preloadData) {
        return this.sync();
      }
    };

    Binding.prototype.unbind = function() {
      var ai, args, fi, j, len, observer, ref2, ref3, ref4, ref5;
      if ((ref2 = this.binder.unbind) != null) {
        ref2.call(this, this.el);
      }
      if ((ref3 = this.observer) != null) {
        ref3.unobserve();
      }
      ref4 = this.dependencies;
      for (j = 0, len = ref4.length; j < len; j++) {
        observer = ref4[j];
        observer.unobserve();
      }
      this.dependencies = [];
      ref5 = this.formatterObservers;
      for (fi in ref5) {
        args = ref5[fi];
        for (ai in args) {
          observer = args[ai];
          observer.unobserve();
        }
      }
      return this.formatterObservers = {};
    };

    Binding.prototype.update = function(models) {
      var ref2, ref3;
      if (models == null) {
        models = {};
      }
      this.model = (ref2 = this.observer) != null ? ref2.target : void 0;
      return (ref3 = this.binder.update) != null ? ref3.call(this, models) : void 0;
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

  Rivets.ComponentBinding = (function(superClass) {
    extend(ComponentBinding, superClass);

    function ComponentBinding(view1, el1, type1) {
      this.view = view1;
      this.el = el1;
      this.type = type1;
      this.unbind = bind(this.unbind, this);
      this.isRenderedComponent = bind(this.isRenderedComponent, this);
      this.bind = bind(this.bind, this);
      this.insertContent = bind(this.insertContent, this);
      this.buildComponentContent = bind(this.buildComponentContent, this);
      this.buildRuntimeComponentTemplate = bind(this.buildRuntimeComponentTemplate, this);
      this.buildComponentTemplate = bind(this.buildComponentTemplate, this);
      this.buildViewInstance = bind(this.buildViewInstance, this);
      this.locals = bind(this.locals, this);
      this.component = this.view.components[this.type];
      this["static"] = {};
      this.binders = {};
      this.upstreamObservers = {};
    }

    ComponentBinding.prototype.sync = function() {};

    ComponentBinding.prototype.update = function() {};

    ComponentBinding.prototype.publish = function() {};

    ComponentBinding.prototype.locals = function() {
      var binder, key, ref2, ref3, result, value;
      result = {};
      ref2 = this["static"];
      for (key in ref2) {
        value = ref2[key];
        result[key] = value;
      }
      ref3 = this.binders;
      for (key in ref3) {
        binder = ref3[key];
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
        var ref2;
        return (ref2 = content.attributes["select"]) != null ? ref2 : -{
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

    ComponentBinding.prototype.bind = function() {
      var attribute, base, binder, bindingRegExp, componentContent, componentTemplate, j, k, key, l, len, len1, len2, m, option, options, propertyName, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, results, scope, v;
      if (this.componentView != null) {
        this.componentView.bind();
        if (this.templateView != null) {
          return this.templateView.bind();
        }
      } else {
        this.el._bound = true;
        options = {};
        ref2 = Rivets.extensions;
        for (j = 0, len = ref2.length; j < len; j++) {
          option = ref2[j];
          options[option] = {};
          if (this.component[option]) {
            ref3 = this.component[option];
            for (k in ref3) {
              v = ref3[k];
              options[option][k] = v;
            }
          }
          ref4 = this.view[option];
          for (k in ref4) {
            v = ref4[k];
            if ((base = options[option])[k] == null) {
              base[k] = v;
            }
          }
        }
        ref5 = Rivets.options;
        for (l = 0, len1 = ref5.length; l < len1; l++) {
          option = ref5[l];
          options[option] = (ref6 = this.component[option]) != null ? ref6 : this.view[option];
        }
        bindingRegExp = this.view.bindingRegExp();
        ref7 = this.el.attributes || [];
        for (m = 0, len2 = ref7.length; m < len2; m++) {
          attribute = ref7[m];
          if (!bindingRegExp.test(attribute.name) && attribute.value) {
            propertyName = this.camelCase(attribute.name);
            if (indexOf.call((ref8 = this.component["static"]) != null ? ref8 : [], propertyName) >= 0) {
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
        ref9 = this.binders;
        results = [];
        for (key in ref9) {
          binder = ref9[key];
          results.push(this.upstreamObservers[key] = this.observe(scope, key, ((function(_this) {
            return function(key, binder) {
              return function() {
                var ref10;
                if (typeof ((ref10 = binder.observer) != null ? ref10.value() : void 0) !== 'function') {
                  return binder.publish();
                }
              };
            };
          })(this)).call(this, key, binder)));
        }
        return results;
      }
    };

    ComponentBinding.prototype.isRenderedComponent = function() {
      return !this.el.hasAttribute('runtime-rendering');
    };

    ComponentBinding.prototype.unbind = function() {
      var binder, key, observer, ref2, ref3, ref4, ref5, ref6;
      ref2 = this.upstreamObservers;
      for (key in ref2) {
        observer = ref2[key];
        observer.unobserve();
      }
      ref3 = this.binders;
      for (key in ref3) {
        binder = ref3[key];
        binder.unbind();
      }
      if ((ref4 = this.component.unbind) != null) {
        ref4.call(this);
      }
      if (!this.component.block) {
        if ((ref5 = this.componentView) != null) {
          ref5.unbind.call(this);
        }
      }
      return (ref6 = this.templateView) != null ? ref6.unbind.call(this) : void 0;
    };

    return ComponentBinding;

  })(Rivets.Binding);

  Rivets.TextBinding = (function(superClass) {
    extend(TextBinding, superClass);

    function TextBinding(view1, el1, type1, keypath1, options1) {
      this.view = view1;
      this.el = el1;
      this.type = type1;
      this.keypath = keypath1;
      this.options = options1 != null ? options1 : {};
      this.sync = bind(this.sync, this);
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
      return TextBinding.__super__.sync.call(this);
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
      var ref2;
      if (el.type === 'radio') {
        return el.checked = ((ref2 = el.value) != null ? ref2.toString() : void 0) === (value != null ? value.toString() : void 0);
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
      var ref2;
      if (el.type === 'radio') {
        return el.checked = ((ref2 = el.value) != null ? ref2.toString() : void 0) !== (value != null ? value.toString() : void 0);
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
      var j, len, o, ref2, ref3, ref4, results;
      if (window.jQuery != null) {
        el = jQuery(el);
        if ((value != null ? value.toString() : void 0) !== ((ref2 = el.val()) != null ? ref2.toString() : void 0)) {
          return el.val(value != null ? value : '');
        }
      } else {
        if (el.type === 'select-multiple') {
          if (value != null) {
            results = [];
            for (j = 0, len = el.length; j < len; j++) {
              o = el[j];
              results.push(o.selected = (ref3 = o.value, indexOf.call(value, ref3) >= 0));
            }
            return results;
          }
        } else if ((value != null ? value.toString() : void 0) !== ((ref4 = el.value) != null ? ref4.toString() : void 0)) {
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
      var ref2;
      this.marker = null;
      if ((ref2 = this.nested) != null) {
        ref2.unbind();
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
      var ref2;
      return (ref2 = this.nested) != null ? ref2.update(models) : void 0;
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
      var attr, j, len, ref2, view;
      if (this.marker == null) {
        attr = [this.view.prefix, this.type].join('-').replace('--', '-');
        this.marker = document.createComment(" rivets: " + this.type + " ");
        this.iterated = [];
        el.removeAttribute(attr);
        el.parentNode.insertBefore(this.marker, el);
        el.parentNode.removeChild(el);
      } else {
        ref2 = this.iterated;
        for (j = 0, len = ref2.length; j < len; j++) {
          view = ref2[j];
          view.bind();
        }
      }
    },
    unbind: function(el) {
      var j, len, ref2, results, view;
      if (this.iterated != null) {
        ref2 = this.iterated;
        results = [];
        for (j = 0, len = ref2.length; j < len; j++) {
          view = ref2[j];
          results.push(view.unbind());
        }
        return results;
      }
    },
    routine: function(el, collection) {
      var binding, data, i, index, j, key, l, len, len1, len2, m, model, modelName, options, previous, ref2, ref3, ref4, results, template, view;
      modelName = this.args[0];
      collection = collection || [];
      if (this.iterated.length > collection.length) {
        ref2 = Array(this.iterated.length - collection.length);
        for (j = 0, len = ref2.length; j < len; j++) {
          i = ref2[j];
          view = this.iterated.pop();
          view.unbind();
          this.marker.parentNode.removeChild(view.els[0]);
        }
      }
      for (index = l = 0, len1 = collection.length; l < len1; index = ++l) {
        model = collection[index];
        data = {
          index: index
        };
        data[modelName] = model;
        if (this.iterated[index] == null) {
          ref3 = this.view.models;
          for (key in ref3) {
            model = ref3[key];
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
        ref4 = this.view.bindings;
        results = [];
        for (m = 0, len2 = ref4.length; m < len2; m++) {
          binding = ref4[m];
          if (binding.el === this.marker.parentNode && binding.type === 'value') {
            results.push(binding.sync());
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    },
    update: function(models) {
      var data, j, key, len, model, ref2, results, view;
      data = {};
      for (key in models) {
        model = models[key];
        if (key !== this.args[0]) {
          data[key] = model;
        }
      }
      ref2 = this.iterated;
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        view = ref2[j];
        results.push(view.update(data));
      }
      return results;
    }
  };

  Rivets["public"].binders['class-*'] = function(el, value) {
    var elClass;
    elClass = " " + el.className + " ";
    if (!value === (elClass.indexOf(" " + this.args[0] + " ") !== -1)) {
      return el.className = value ? el.className + " " + this.args[0] : elClass.replace(" " + this.args[0] + " ", ' ').trim();
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
      var base, id, name;
      if (!obj.hasOwnProperty(this.id)) {
        id = this.counter++;
        Object.defineProperty(obj, this.id, {
          value: id
        });
      }
      return (base = this.weakmap)[name = obj[this.id]] || (base[name] = {
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
        var callback, j, k, len, r, ref2, ref3, ref4, ref5, response;
        response = original.apply(obj, arguments);
        ref2 = map.pointers;
        for (r in ref2) {
          k = ref2[r];
          ref5 = (ref3 = (ref4 = weakmap[r]) != null ? ref4.callbacks[k] : void 0) != null ? ref3 : [];
          for (j = 0, len = ref5.length; j < len; j++) {
            callback = ref5[j];
            callback();
          }
        }
        return response;
      };
    },
    observeMutations: function(obj, ref, keypath) {
      var base, fn, functions, j, len, map;
      if (Array.isArray(obj)) {
        map = this.weakReference(obj);
        if (map.pointers == null) {
          map.pointers = {};
          functions = ['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'];
          for (j = 0, len = functions.length; j < len; j++) {
            fn = functions[j];
            this.stubFunction(obj, fn);
          }
        }
        if ((base = map.pointers)[ref] == null) {
          base[ref] = [];
        }
        if (indexOf.call(map.pointers[ref], keypath) < 0) {
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
                var j, len, map, ref2;
                if (newValue !== value) {
                  _this.unobserveMutations(value, obj[_this.id], keypath);
                  value = newValue;
                  if (map = _this.weakmap[obj[_this.id]]) {
                    callbacks = map.callbacks;
                    if (callbacks[keypath]) {
                      ref2 = callbacks[keypath].slice();
                      for (j = 0, len = ref2.length; j < len; j++) {
                        callback = ref2[j];
                        if (indexOf.call(callbacks[keypath], callback) >= 0) {
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
      if (indexOf.call(callbacks[keypath], callback) < 0) {
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
