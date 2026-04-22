declare const defineProperties: <T extends object, U extends object>(target: T, properties: U, descriptor: {
    configurable: boolean;
    enumerable: boolean;
    writable: boolean;
}) => { [K in keyof (T & U)]: K extends keyof U ? U[K] : K extends keyof T ? T[K] : never; };
export default defineProperties;
