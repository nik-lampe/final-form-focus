;(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports)
    : typeof define === 'function' && define.amd
      ? define(['exports'], factory)
      : factory((global['final-form-focus'] = {}))
})(this, function(exports) {
  'use strict'

  //
  var toPath = function toPath(key) {
    if (key === null || key === undefined) {
      return []
    }
    if (typeof key !== 'string') {
      throw new Error('toPath() expects a string')
    }
    return key.length ? key.split(/[.[\]]+/).filter(Boolean) : []
  }

  var _typeof =
    typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
      ? function(obj) {
          return typeof obj
        }
      : function(obj) {
          return obj &&
            typeof Symbol === 'function' &&
            obj.constructor === Symbol &&
            obj !== Symbol.prototype
            ? 'symbol'
            : typeof obj
        }

  //

  var getIn = function getIn(state, complexKey) {
    // Intentionally using iteration rather than recursion
    var path = toPath(complexKey)
    var current = state
    var _iteratorNormalCompletion = true
    var _didIteratorError = false
    var _iteratorError = undefined

    try {
      for (
        var _iterator = path[Symbol.iterator](), _step;
        !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
        _iteratorNormalCompletion = true
      ) {
        var key = _step.value

        if (
          current === undefined ||
          current === null ||
          (typeof current === 'undefined' ? 'undefined' : _typeof(current)) !==
            'object' ||
          (Array.isArray(current) && isNaN(key))
        ) {
          return undefined
        }
        current = current[key]
      }
    } catch (err) {
      _didIteratorError = true
      _iteratorError = err
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return()
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError
        }
      }
    }

    return current
  }

  //
  /**
   * Predicate to identify inputs that can have focus() called on them
   */
  var isFocusableInput = function isFocusableInput(wtf) {
    return !!(wtf && typeof wtf.focus === 'function')
  }

  //

  /**
   * Gets all the inputs inside all forms on the page
   */
  var getAllInputs = function getAllInputs() {
    if (typeof document === 'undefined') {
      return []
    }
    return Array.prototype.slice
      .call(document.forms)
      .reduce(function(accumulator, form) {
        return accumulator.concat(
          Array.prototype.slice.call(form).filter(isFocusableInput)
        )
      }, [])
  }

  //

  /**
   * Finds the input by looking if the name attribute path is existing in the errors object
   */
  var findInput = function findInput(inputs, errors) {
    return inputs.find(function(input) {
      return input.name && getIn(errors, input.name)
    })
  }

  //

  var createDecorator = function createDecorator(getInputs, findInput$$1) {
    return function(form) {
      var focusOnFirstError = function focusOnFirstError(errors) {
        if (!getInputs) {
          getInputs = getAllInputs
        }
        if (!findInput$$1) {
          findInput$$1 = findInput
        }
        var firstInput = findInput$$1(getInputs(), errors)
        if (firstInput) {
          firstInput.focus()
        }
      }
      // Save original submit function
      var originalSubmit = form.submit

      // Subscribe to errors, and keep a local copy of them
      var state = {}
      var unsubscribe = form.subscribe(
        function(nextState) {
          state = nextState
        },
        { errors: true, submitErrors: true }
      )

      // What to do after submit
      var afterSubmit = function afterSubmit() {
        var _state = state,
          errors = _state.errors,
          submitErrors = _state.submitErrors

        if (errors && Object.keys(errors).length) {
          focusOnFirstError(errors)
        } else if (submitErrors && Object.keys(submitErrors).length) {
          focusOnFirstError(submitErrors)
        }
      }

      // Rewrite submit function
      form.submit = function() {
        var result = originalSubmit.call(form)
        if (result && typeof result.then === 'function') {
          // async
          result.then(afterSubmit)
        } else {
          // sync
          afterSubmit()
        }
        return result
      }

      return function() {
        unsubscribe()
        form.submit = originalSubmit
      }
    }
  }

  //

  /**
   * Generates a function to get all the inputs in a form with the specified name
   */
  var getFormInputs = function getFormInputs(name) {
    return function() {
      if (typeof document === 'undefined') {
        return []
      }
      // $FlowFixMe
      var form = document.forms[name]
      return form && form.length
        ? Array.prototype.slice.call(form).filter(isFocusableInput)
        : [] // cast cheat to get from HTMLFormElement children to FocusableInput
    }
  }

  //

  exports.default = createDecorator
  exports.getFormInputs = getFormInputs

  Object.defineProperty(exports, '__esModule', { value: true })
})
//# sourceMappingURL=final-form-focus.umd.js.map
