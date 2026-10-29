import Capacitor

/// Uygulamanın kendi içindeki eklentileri (npm paketi olmayanları) köprüye kaydeder.
class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleSignInPlugin())
    }
}
