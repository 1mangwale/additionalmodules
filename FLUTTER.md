# Flutter App Plan — Mangwale V2 (User + Vendor)

This plan maps the existing NestJS APIs to a single Flutter app that offers:
- User experience: browse rooms/services, price, book, cancel
- Vendor experience: manage room types/inventory, services/slots

## Architecture
- Flutter: Riverpod (state), GoRouter (routing), Dio (HTTP), Freezed/JsonSerializable (models)
- Platforms: Android/iOS/Web (CORS enabled for localhost)
- Envs: `.env` using flutter_dotenv for API base URLs

## Packages
- flutter_riverpod, go_router, dio, freezed_annotation, json_serializable, build_runner
- flutter_dotenv, intl

## API base URLs
- ROOMS: http://localhost:4001
- SERVICES: http://localhost:4002
- GATEWAY (optional landing): http://localhost:4000

## Data models (example)
- lib/models/room.dart (RoomType, RoomInventory)
- lib/models/service.dart (ServiceCatalog, ServiceSlot)
- lib/models/booking.dart (CreateRoomBookingDto)

## HTTP client
- lib/core/http.dart (Dio with base options, interceptors)

## Repositories
- lib/repos/rooms_repo.dart
  - search(checkIn, checkOut, guests) -> items
  - price(body) -> quote
  - book(dto) -> bookingId
  - cancel(bookingId, askRefund)
  - vendor: listRoomTypes(), createRoomType(), listInventory(), upsertInventory()
- lib/repos/services_repo.dart
  - catalog(), slots(q), book(dto), complete(jobId), cancel(jobId)
  - vendor: listCatalog(), createService(), listSlots(), createSlot()

## Screens
- User
  - Home: tabs Rooms | Services
  - Rooms Search: filter by dates/guests, show results, Book CTA
  - Services Catalog: list, Book CTA
  - Booking Form: collects details -> calls book
  - My Bookings: list (later, after we add persistence)
- Vendor
  - Dashboard: Room Types list + Add, Inventory list + Add/Update
  - Services: Catalog list + Add, Slots list + Add

## Sample: HTTP wrapper (Dart)
```dart
final dio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 8)));
```

## Sample: Rooms repo search (Dart)
```dart
Future<List<dynamic>> searchRooms(DateTime inDate, DateTime outDate, int guests) async {
  final url = '${dotenv.env['ROOMS_BASE']}/rooms/search?checkin=${DateFormat('yyyy-MM-dd').format(inDate)}&checkout=${DateFormat('yyyy-MM-dd').format(outDate)}&guests=$guests';
  final r = await dio.get(url);
  return (r.data['items'] as List?) ?? [];
}
```

## Mock-friendly
- FINANCE_MOCK=true already bypasses V1 payment calls in Rooms
- You can fake data for services/rooms when backend is empty

## Next steps
1. Create Flutter project `apps/flutter`
2. Add packages and the folder structure above
3. Implement RoomsRepo and ServicesRepo
4. Build screens incrementally (User first), then Vendor
5. Wire envs and test against localhost APIs
```
