'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

var finalForm = require('final-form')

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

var defaultFindInput = function defaultFindInput(inputs, errors) {
  return inputs.find(function(input) {
    return input.name && finalForm.getIn(errors, input.name)
  })
}

var createDecorator = function createDecorator(getInputs, findInput) {
  return function(form) {
    var focusOnFirstError = function focusOnFirstError(errors) {
      if (!getInputs) {
        getInputs = getAllInputs
      }
      if (!findInput) {
        findInput = defaultFindInput
      }
      var firstInput = findInput(getInputs(), errors)
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
