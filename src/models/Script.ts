import { Schema, model, models, Types, type HydratedDocument, type Model } from 'mongoose';

export interface ScriptAttributes {
  projectId: Types.ObjectId;
  ownerId: Types.ObjectId;
  topic: string;
  tone: 'educational' | 'bedtime' | 'documentary' | 'conversational' | 'dramatic' | 'custom';
  style: string;
  lengthMinutes: number;
  chapters: number;
  outline: string[];
  content: string;
  targetWordCount: number;
  actualWordCount: number;
  status: 'draft' | 'generating' | 'ready' | 'error';
  error: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScriptSchema = new Schema<ScriptAttributes>({
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

export type ScriptDocument = HydratedDocument<ScriptAttributes>;
export type ScriptLean = ScriptAttributes & { _id: Types.ObjectId };

const Script =
  (models.Script as Model<ScriptAttributes> | undefined) || model<ScriptAttributes>('Script', ScriptSchema);

export default Script;
