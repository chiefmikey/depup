declare const defineIntrinsics: <T extends object, U extends object>(target: T, properties: U) => { [K in keyof (T & U)]: K extends keyof U ? U[K] : K extends keyof T ? T[K] : never; };
export default defineIntrinsics;
