declare module '@tarojs/taro' {
  export interface RequestOption {
    url: string
    method?: string
    data?: unknown
    header?: Record<string, string>
  }

  export interface RequestSuccessCallbackResult {
    statusCode?: number
    data?: unknown
  }

  export interface SystemInfo {
    system?: string
    model?: string
    version?: string
  }

  export interface NetworkTypeResult {
    networkType?: string
  }

  export interface NetworkStatusChangeResult {
    isConnected?: boolean
  }

  export interface TaroStatic {
    getStorageSync(key: string): unknown
    setStorageSync(key: string, value: unknown): void
    removeStorageSync(key: string): void
    request(options: RequestOption): Promise<RequestSuccessCallbackResult>
    getSystemInfoSync(): SystemInfo
    getNetworkType(): Promise<NetworkTypeResult>
    onNetworkStatusChange(callback: (result: NetworkStatusChangeResult) => void): void
    offNetworkStatusChange?(callback: (result: NetworkStatusChangeResult) => void): void
  }

  const Taro: TaroStatic
  export default Taro
}

declare function getCurrentPages(): Array<{ route?: string }>
