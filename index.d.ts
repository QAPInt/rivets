declare module 'rivets' {
  export interface Observer {
    unobserve: () => any
    value: () => any
  }

  export interface View {
    build(): void;
    bind(): void;
    unbind(): void;
    addBinding(node: HTMLElement, type: Binder<any> | string, declaration: string): Binding
  }

  export interface Binding {
    view: View
    unbind: () => any
    observe: (obj: Object, keypath: string, callback: (newValue) => void) => Observer
  }

  export interface FunctionalBinder<ValueType> {
    (this: Binding, element: HTMLElement, value: ValueType): void
  }

  export interface Binder<ValueType> {
    routine: FunctionalBinder<ValueType>
    bind?: (this: Binding, element: HTMLElement) => void
    unbind?: (this: Binding, element: HTMLElement) => void
    update?: (this: Binding, model: ValueType) => void
    getValue?: (this: Binding, element: HTMLElement) => void
  }

  export interface Binders {
    string: Binder<any> | FunctionalBinder<any>
  }

  export interface Rivets {
    // Global binders.
    binders: Binders;

    // Global components.
    components: Object;

    // Global formatters.
    formatters: Object;

    // Global sightglass adapters.
    adapters: Object;

    // Default attribute prefix.
    prefix: string;

    // Default template delimiters.
    templateDelimiters: Array<string>;

    // Default sightglass root interface.
    rootInterface: string;

    // Preload data by default.
    preloadData: boolean;

    handler(context: any, ev: Event, biding: any): void;

    configure(options?: {

      // Attribute prefix in templates
      prefix?: string;

      //Preload templates with initial data on bind
      preloadData?: boolean;

      //Root sightglass interface for keypaths
      rootInterface?: string;

      // Template delimiters for text bindings
      templateDelimiters?: Array<string>

      // Augment the event handler of the on-* binder
      handler?: Function;
    }): void;

    bind(element: HTMLElement, models: Object, options?: Object): View;
    // bind(element: JQuery, models: Object, options?: Object): View;
    bind(element: Array<HTMLElement>, models: Object, options?: Object): View;
  }
}