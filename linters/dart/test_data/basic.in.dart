library;
import 'dart:io';
class Vector2d {
final double x, y;
Vector2d(this.x, this.y);
}
class Vector3d extends Vector2d {
final double z;
Vector3d(final double x, final double y, this.z) : super(x, y);
}

void main() {
  expect(find.text(''), empty);
}
