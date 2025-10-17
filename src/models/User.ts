import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, unique: true, index: true, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() }
});

const User = models.User || model('User', UserSchema);

export default User;
