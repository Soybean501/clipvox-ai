import { Schema, model, models, Types } from 'mongoose';

const ScriptSchema = new Schema({
  projectId: { type: Types.ObjectId, ref: 'Project', index: true, required: true },
  ownerId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
  topic: { type: String, required: true },
  tone: {
    type: String,
    enum: ['educational', 'bedtime', 'documentary', 'conversational', 'dramatic', 'custom'],
    default: 'educational'
  },
  style: { type: String, default: '' },
  lengthMinutes: { type: Number, min: 1, max: 300, required: true },
  chapters: { type: Number, min: 1, max: 50, required: true },
  outline: { type: [String], default: [] },
  content: { type: String, default: '' },
  targetWordCount: { type: Number, default: 0 },
  actualWordCount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'generating', 'ready', 'error'], default: 'draft' },
  error: { type: String, default: '' },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() }
});

ScriptSchema.pre('save', function save(next) {
  this.updatedAt = new Date();
  next();
});

// TODO: Store pointers to generated audio/video assets in future releases.

const Script = models.Script || model('Script', ScriptSchema);

export default Script;
