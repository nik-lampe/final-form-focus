// @flow
import type { Decorator, FormApi } from 'final-form'
import type { GetInputs, FindInput, FocusableInput } from './types'
import { getIn } from 'final-form'
import getAllInputs from './getAllInputs'

const defaultFindInput: FindInput = (
  inputs: FocusableInput[],
  errors: Object
): ?FocusableInput =>
  inputs.find(input => input.name && getIn(errors, input.name))

const createDecorator = (
  getInputs?: GetInputs,
  findInput?: FindInput
): Decorator => (form: FormApi) => {
  const focusOnFirstError = (errors: Object) => {
    if (!getInputs) {
      getInputs = getAllInputs
    }
    if (!findInput) {
      findInput = defaultFindInput
    }
    const firstInput = findInput(getInputs(), errors)
    if (firstInput) {
      firstInput.focus()
    }
  }
  // Save original submit function
  const originalSubmit = form.submit

  // Subscribe to errors, and keep a local copy of them
  let state: { errors?: Object, submitErrors?: Object } = {}
  const unsubscribe = form.subscribe(
    nextState => {
      state = nextState
    },
    { errors: true, submitErrors: true }
  )

  // What to do after submit
  const afterSubmit = () => {
    const { errors, submitErrors } = state
    if (errors && Object.keys(errors).length) {
      focusOnFirstError(errors)
    } else if (submitErrors && Object.keys(submitErrors).length) {
      focusOnFirstError(submitErrors)
    }
  }

  // Rewrite submit function
  form.submit = () => {
    const result = originalSubmit.call(form)
    if (result && typeof result.then === 'function') {
      // async
      result.then(afterSubmit)
    } else {
      // sync
      afterSubmit()
    }
    return result
  }

  return () => {
    unsubscribe()
    form.submit = originalSubmit
  }
}

export default createDecorator
