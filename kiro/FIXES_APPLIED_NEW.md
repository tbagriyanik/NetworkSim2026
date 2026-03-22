# 2026-03-22 - State Management & UX Refactoring

- **State Management:** `page.tsx` ve `NetworkTopology.tsx` üzerinde yerel `useState` kullanımı kaldırıldı, `useAppStore` (Zustand) üzerinden merkezi durum yönetimine geçildi.
- **Testing:** `lib/network/connectivity.ts` için birim testleri oluşturuldu (Ping, IP yalıtımı ve VLAN yalıtımı senaryoları eklendi).
- **UX/ARIA:** `DeviceNode` bileşenine ARIA etiketleri ve klavye etkileşimi (Enter/Space) eklendi. Mobil dokunma hedefleri (invisible rect) genişletildi.
