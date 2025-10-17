import { a as gotoBlock, o as objectModules } from "./app.min.js";
class FormsValidation {
  constructor(options) {
    let defaultConfig = {
      viewpass: false,
      autoHeight: false,
      logging: true,
      errorMesseges: {
        valueMissing: "Будь ласка, заповніть це поле.",
        validateName: {
          enterName: `Будь ласка, введіть Ваше ім’я.`,
          containsNumbers: `Ім’я не може містити цифри.`,
          containsOnlyAlphabet: `Ім’я може містити лише літери українського алфавіту та починатися з великої літери.`
        },
        validateEmail: {
          enterEmail: `Будь ласка, введіть Ваш email`,
          invalidEmail: {
            incorrectEmail: `Ви ввели некоректну єлектронну адресу`,
            missingAtSymbol: (value) => `Електронна адреса має містити символ "@". Єлектронна адреса "${value}" не містить символ "@"`
          }
        },
        validatePhone: {
          enterPhone: "Будь ласка, введіть Ваш номер телефону.",
          invalidPhone: {
            incorrectPhone: "Ви ввели некоректний номер."
          }
        },
        validateSelect: `Будь ласка, виберіть варіант зі списку.`
      },
      reqexp: {
        name: /^[А-ЩЬЮЯЄІЇҐ][а-щьюяєіїґ']{1,29}(-[А-ЩЬЮЯЄІЇҐ][а-щьюяєіїґ']{1,29})?$/,
        email: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/,
        phone: /^\+38\(\d{3}\)[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/
      },
      on: {
        formSend: () => {
        }
      }
    };
    this.config = {
      ...defaultConfig,
      ...options,
      errorMesseges: {
        ...defaultConfig.errorMesseges,
        ...options?.errorMesseges
      },
      reqexp: {
        ...defaultConfig.reqexp,
        ...options?.reqexp
      },
      on: {
        ...defaultConfig.on,
        ...options?.on
      }
    };
    this.formAttributes = {
      required: "data-required",
      validate: "data-validate",
      noValidate: "data-no-validate",
      noFocusClasses: "data-no-focus-classes",
      modalMessage: "data-modal-message",
      gotoError: "data-goto-error",
      autoHeight: "data-autoheight",
      autoHeightMin: "data-autoheight-min",
      autoHeightMax: "data-autoheight-max",
      error: "data-error",
      ajax: "data-ajax",
      dev: "data-dev"
    };
    this.formClasses = {
      formFocus: "form-focus",
      formSuccess: "form-success",
      formError: "form-error",
      formSending: "form-sending",
      viewPass: "viewpass",
      viewPassActive: "viewpass-active"
    };
    this.eventsForm();
    if (this.config.autoHeight) this.autoHeight();
  }
  eventsForm() {
    document.addEventListener("focusin", ({ target }) => this.focusIn(target));
    document.addEventListener("focusout", ({ target }) => this.focusOut(target));
    document.addEventListener("change", ({ target }) => this.inputChange(target));
    document.addEventListener("selectCallback", ({ detail }) => this.selectChange(detail));
    if (this.config.viewpass) {
      document.addEventListener("click", ({ target }) => this.inputViewPass(target));
    }
    document.addEventListener("submit", (e) => this.formSubmit(e));
  }
  formSubmit(e) {
    const formElement = e.target.closest("[data-form]");
    if (!formElement) return;
    this.formSubmitAction(formElement, e);
  }
  async formSubmitAction(form, e) {
    e.preventDefault();
    const error = !form.hasAttribute(this.formAttributes.noValidate) ? this.getErrorField(form) : 0;
    if (error !== 0) {
      if (form.querySelector(this.formClasses.formError) && form.hasAttribute(this.formAttributes.gotoError)) {
        const formGoToErrorClass = form.dataset.gotoError || ".form-error";
        gotoBlock(formGoToErrorClass, { noHeader: true, speed: 1e3 });
      }
      return;
    }
    const ajax = form.hasAttribute(this.formAttributes.ajax);
    const dev = form.hasAttribute(this.formAttributes.dev);
    try {
      if (ajax) {
        const formAction = form.getAttribute("action") ? form.getAttribute("action").trim() : "#";
        const formMethod = form.getAttribute("method") ? form.getAttribute("method").trim() : "GET";
        const formData = new FormData(form);
        form.classList.add(this.formClasses.formSending);
        const response = await fetch(formAction, {
          method: formMethod,
          body: formMethod !== "GET" ? formData : null
        });
        if (!response.ok) {
          const errorMassage = "Щось пішло не так!";
          throw new Error(errorMassage);
        }
        const responseData = await response.json();
        this.formSending(form, responseData);
      }
      if (dev) {
        this.formSending(form);
      }
    } catch (error2) {
      this.#formLogging(error2);
    } finally {
      form.classList.remove(this.formClasses.formSending);
    }
  }
  formSending(form, responseResult = ``) {
    document.dispatchEvent(
      new CustomEvent("formSent", {
        detail: {
          form
        }
      })
    );
    setTimeout(() => {
      if (objectModules.modal) {
        const { modalMessage } = form.dataset;
        if (modalMessage) {
          objectModules.modal.open(modalMessage);
        }
      }
    }, 0);
    this.config.on.formSend(form);
    this.formClean(form);
    this.#formLogging(`Form send!`);
  }
  formClean(form) {
    form.reset();
    setTimeout(() => {
      const inputs = form.querySelectorAll("input,textarea");
      const checkboxes = form.querySelectorAll("input[type=checkbox]");
      const radioButtons = form.querySelectorAll("input[type=radio]");
      if (inputs.length > 0) {
        inputs.forEach((input) => {
          this.removeFieldError(input);
          this.removeFieldSuccess(input);
        });
      }
      if (checkboxes.length > 0) {
        checkboxes.forEach((checkbox) => checkbox.checked = false);
      }
      if (radioButtons.length > 0) {
        radioButtons.forEach((radio) => radio.checked = false);
      }
      if (objectModules.select) {
        const selects = form.querySelectorAll("div.select");
        if (selects.length > 0) {
          selects.forEach((selectItem) => {
            const originalSelect = selectItem.querySelector("select");
            const { options, multiple } = originalSelect;
            this.removeSelectFieldError(selectItem, originalSelect);
            this.removeSelectFieldSuccess(selectItem, originalSelect);
            Array.from(options).forEach((option, index) => {
              if (!multiple) {
                index === 0 ? option.setAttribute("selected", "") : option.removeAttribute("selected");
              } else {
                option.removeAttribute("selected");
              }
            });
            objectModules.select.selectBuild(originalSelect);
          });
        }
      }
    }, 0);
  }
  inputViewPass(target) {
    if (target.closest(`[class*="__${this.formClasses.viewPass}"]`)) {
      const viewPassButton = target.closest(`[class*="__${this.formClasses.viewPass}"]`);
      let inputType = viewPassButton.classList.contains(this.formClasses.viewPassActive) ? "password" : "text";
      viewPassButton.parentElement.querySelector("input").setAttribute("type", inputType);
      viewPassButton.classList.toggle(this.formClasses.viewPassActive);
    }
  }
  autoHeight() {
    const textareas = document.querySelectorAll(`textarea[${this.formAttributes.autoHeight}]`);
    if (textareas.length > 0) {
      textareas.forEach((textarea) => {
        const startHeight = textarea.hasAttribute(this.formAttributes.autoHeightMin) ? +textarea.dataset.autoheightMin : +textarea.offsetHeight;
        const maxHeight = textarea.hasAttribute(this.formAttributes.autoHeightMax) ? +textarea.dataset.autoheightMax : Infinity;
        this.#setTextareaHeight(textarea, Math.min(startHeight, maxHeight));
        textarea.addEventListener("input", () => {
          if (textarea.scrollHeight > startHeight) {
            textarea.style.height = `auto`;
            this.#setTextareaHeight(textarea, Math.min(Math.max(textarea.scrollHeight, startHeight), maxHeight));
          }
        });
      });
    }
  }
  #setTextareaHeight(textarea, height) {
    textarea.style.height = `${height}px`;
  }
  inputChange(target) {
    const { type } = target;
    if (type === "checkbox" || type === "radio") {
      this.validateField(target);
    }
  }
  focusIn(target) {
    const { tagName } = target;
    if (tagName === "INPUT" || tagName === "TEXTAREA") {
      if (!target.hasAttribute(this.formAttributes.noFocusClasses)) {
        target.classList.add(this.formClasses.formFocus);
        target.parentElement.classList.add(this.formClasses.formFocus);
      }
      if (target.hasAttribute(this.formAttributes.validate)) {
        this.removeFieldError(target);
      }
    }
  }
  focusOut(target) {
    const { tagName } = target;
    if (tagName === "INPUT" || tagName === "TEXTAREA") {
      if (!target.hasAttribute(this.formAttributes.noFocusClasses)) {
        target.classList.remove(this.formClasses.formFocus);
        target.parentElement.classList.remove(this.formClasses.formFocus);
      }
      if (target.hasAttribute(this.formAttributes.validate)) {
        this.validateField(target);
      }
    }
  }
  selectChange(detail) {
    const { select } = detail;
    if (select) this.validateField(select);
  }
  getErrorField(form) {
    let error = 0;
    const formRequiredItems = form.querySelectorAll(`*[${this.formAttributes.required}]`);
    if (formRequiredItems.length > 0) {
      formRequiredItems.forEach((formRequiredItem) => {
        if ((formRequiredItem.offsetParent !== null || formRequiredItem.tagName === "SELECT") && !formRequiredItem.disabled) {
          error += this.validateField(formRequiredItem);
        }
      });
    }
    return error;
  }
  validateField(formRequiredItem) {
    const { required } = formRequiredItem.dataset;
    const { type, tagName } = formRequiredItem;
    let error = 0;
    if (required === "name") {
      if (!formRequiredItem.value.trim()) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validateName.enterName);
        error++;
        return;
      }
      if (this.#digitsTest(formRequiredItem)) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validateName.containsNumbers);
        error++;
        return;
      }
      if (this.#nameTest(formRequiredItem)) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validateName.containsOnlyAlphabet);
        error++;
      } else {
        this.removeFieldError(formRequiredItem);
        this.addFieldSuccess(formRequiredItem);
      }
    }
    if (required === "email") {
      if (!formRequiredItem.value.trim()) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validateEmail.enterEmail);
        error++;
        return;
      }
      formRequiredItem.value = formRequiredItem.value.replace(" ", "");
      if (this.#emailTest(formRequiredItem)) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validateEmail.invalidEmail.incorrectEmail);
        if (!formRequiredItem.value.includes("@")) {
          this.addFieldError(
            formRequiredItem,
            this.config.errorMesseges.validateEmail.invalidEmail.missingAtSymbol(formRequiredItem.value)
          );
        }
        error++;
      } else {
        this.removeFieldError(formRequiredItem);
        this.addFieldSuccess(formRequiredItem);
      }
    }
    if (required === "phone") {
      if (!formRequiredItem.value.trim()) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validatePhone.enterPhone);
        error++;
        return;
      }
      formRequiredItem.value = formRequiredItem.value.replace(" ", "");
      if (this.#phoneTest(formRequiredItem)) {
        this.addFieldError(formRequiredItem, this.config.errorMesseges.validatePhone.invalidPhone.incorrectPhone);
        this.removeFieldSuccess(formRequiredItem);
        error++;
      } else {
        this.removeFieldError(formRequiredItem);
        this.addFieldSuccess(formRequiredItem);
      }
    }
    if (type === "checkbox") {
      if (!formRequiredItem.checked) {
        this.addFieldError(formRequiredItem, this.config.errorMesseges.valueMissing);
        this.removeFieldSuccess(formRequiredItem);
        error++;
      } else {
        this.removeFieldError(formRequiredItem);
        this.addFieldSuccess(formRequiredItem);
      }
    }
    if (type === "radio") {
      const { name } = formRequiredItem;
      const radioGroup = document.querySelectorAll(`input[name="${name}"]`);
      const isChecked = Array.from(radioGroup).some((radio) => radio.checked);
      const parentBlock = formRequiredItem.closest("fieldset") || formRequiredItem.parentElement;
      const formErrorItem = parentBlock.querySelector(".form__error");
      if (formErrorItem) parentBlock.removeChild(formErrorItem);
      if (!isChecked) {
        if (!formErrorItem && parentBlock.hasAttribute(this.formAttributes.error)) {
          const { error: error2 } = parentBlock.dataset;
          parentBlock.insertAdjacentHTML(
            "beforeend",
            this.getFormErrorHTML(error2, this.config.errorMesseges.valueMissing)
          );
        }
        radioGroup.forEach((radio) => {
          this.addFieldError(radio);
          this.removeFieldSuccess(radio);
        });
        if (!parentBlock.classList.contains(this.formClasses.formError)) {
          parentBlock.classList.add(this.formClasses.formError);
        }
        error++;
      } else {
        radioGroup.forEach((radio) => {
          this.removeFieldError(radio);
          this.addFieldSuccess(radio);
        });
        if (parentBlock.classList.contains(this.formClasses.formError)) {
          parentBlock.classList.remove(this.formClasses.formError);
        }
      }
    }
    if (objectModules.select && tagName === "SELECT") {
      const selectItem = formRequiredItem.parentElement;
      if (formRequiredItem.multiple) {
        const selectedOptions = Array.from(formRequiredItem.selectedOptions).filter((option) => option.value);
        if (!selectedOptions.length) {
          this.removeSelectFieldSuccess(selectItem, formRequiredItem);
          this.addSelectFieldError(selectItem, formRequiredItem, this.config.errorMesseges.validateSelect);
          error++;
        } else {
          this.removeSelectFieldError(selectItem, formRequiredItem);
          this.addSelectFieldSuccess(selectItem, formRequiredItem);
        }
      } else {
        if (!formRequiredItem.value.trim()) {
          this.removeSelectFieldSuccess(selectItem, formRequiredItem);
          this.addSelectFieldError(selectItem, formRequiredItem, this.config.errorMesseges.validateSelect);
          error++;
        } else {
          this.removeSelectFieldError(selectItem, formRequiredItem);
          this.addSelectFieldSuccess(selectItem, formRequiredItem);
        }
      }
    }
    if (tagName !== "SELECT" && type !== "checkbox" && type !== "radio" && required === "") {
      if (!formRequiredItem.value.trim()) {
        this.removeFieldSuccess(formRequiredItem);
        this.addFieldError(formRequiredItem, this.config.errorMesseges.valueMissing);
        error++;
      } else {
        this.removeFieldError(formRequiredItem);
        this.addFieldSuccess(formRequiredItem);
      }
    }
    return error;
  }
  addSelectFieldError(selectItem, originalSelect, errorMessage = "") {
    const parentSelectFormField = selectItem.parentElement;
    const formErrorItem = parentSelectFormField?.querySelector(".form__error");
    if (formErrorItem) parentSelectFormField.removeChild(formErrorItem);
    this.formFieldsToggleErrorClass(selectItem, parentSelectFormField, true);
    this.formFieldSetInvalidAttr(originalSelect);
    this.formFieldSetInvalidAttr(selectItem);
    if (originalSelect.hasAttribute(this.formAttributes.error)) {
      const { error } = originalSelect.dataset;
      parentSelectFormField.insertAdjacentHTML("beforeend", this.getFormErrorHTML(error, errorMessage));
    }
  }
  removeSelectFieldError(selectItem) {
    const parentSelectFormField = selectItem.parentElement;
    const formErrorItem = parentSelectFormField?.querySelector(".form__error");
    if (formErrorItem) parentSelectFormField.removeChild(formErrorItem);
    this.formFieldsToggleErrorClass(selectItem, parentSelectFormField);
  }
  addSelectFieldSuccess(selectItem, originalSelect) {
    const parentSelectFormField = selectItem.parentElement;
    this.formFieldsToggleSuccessClass(selectItem, parentSelectFormField, true);
    this.formFieldSetInvalidAttr(originalSelect, false);
    this.formFieldSetInvalidAttr(selectItem, false);
  }
  removeSelectFieldSuccess(selectItem) {
    const parentSelectFormField = selectItem.parentElement;
    this.formFieldsToggleSuccessClass(selectItem, parentSelectFormField);
  }
  addFieldError(formRequiredItem, errorMessage = "") {
    const parentFormField = formRequiredItem.parentElement;
    const formErrorItem = parentFormField.querySelector(".form__error");
    if (formErrorItem) parentFormField.removeChild(formErrorItem);
    this.formFieldsToggleErrorClass(formRequiredItem, parentFormField, true);
    this.formFieldSetInvalidAttr(formRequiredItem);
    if (formRequiredItem.hasAttribute(this.formAttributes.error)) {
      const { error } = formRequiredItem.dataset;
      parentFormField.insertAdjacentHTML("beforeend", this.getFormErrorHTML(error, errorMessage));
    }
  }
  removeFieldError(formRequiredItem) {
    const parentFormField = formRequiredItem.parentElement;
    const formErrorItem = parentFormField.querySelector(".form__error");
    this.formFieldsToggleErrorClass(formRequiredItem, parentFormField);
    if (formErrorItem) parentFormField.removeChild(formErrorItem);
  }
  addFieldSuccess(formRequiredItem) {
    const parentFormField = formRequiredItem.parentElement;
    this.formFieldsToggleSuccessClass(formRequiredItem, parentFormField, true);
    this.formFieldSetInvalidAttr(formRequiredItem, false);
  }
  removeFieldSuccess(formRequiredItem) {
    const parentFormField = formRequiredItem.parentElement;
    this.formFieldsToggleSuccessClass(formRequiredItem, parentFormField);
  }
  formFieldSetInvalidAttr(formRequiredItem, isInvalid = true) {
    formRequiredItem.setAttribute("aria-invalid", `${isInvalid ? true : false}`);
  }
  formFieldsToggleSuccessClass(formRequiredItem, parentFormField, isSuccess = false) {
    if (!isSuccess) {
      formRequiredItem.classList.remove(this.formClasses.formSuccess);
      parentFormField.classList.remove(this.formClasses.formSuccess);
    } else {
      formRequiredItem.classList.add(this.formClasses.formSuccess);
      parentFormField.classList.add(this.formClasses.formSuccess);
    }
  }
  formFieldsToggleErrorClass(formRequiredItem, parentFormField, isError = false) {
    if (!isError) {
      formRequiredItem.classList.remove(this.formClasses.formError);
      parentFormField.classList.remove(this.formClasses.formError);
    } else {
      formRequiredItem.classList.add(this.formClasses.formError);
      parentFormField.classList.add(this.formClasses.formError);
    }
  }
  getFormErrorHTML(error, errorMassage) {
    return `<div class="form__error">${error || errorMassage}</div>`;
  }
  #nameTest(formRequiredItem) {
    return !this.config.reqexp.name.test(formRequiredItem.value);
  }
  #emailTest(formRequiredItem) {
    return !this.config.reqexp.email.test(formRequiredItem.value);
  }
  #phoneTest(formRequiredItem) {
    return !this.config.reqexp.phone.test(formRequiredItem.value);
  }
  #digitsTest(formRequiredItem) {
    return /\d/.test(formRequiredItem.value);
  }
  #formLogging(message) {
    this.config.logging ? console.log(`[Форми]: ${message}`) : null;
  }
}
objectModules.formsValidation = new FormsValidation({
  reqexp: {
    name: /^[A-Za-z]+([ -][A-Za-z]+)*$/
  }
});
