import { Schema, model, models, Types } from 'mongoose';

const ProjectSchema = new Schema({
  ownerId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() }
});

ProjectSchema.pre('save', function save(next) {
  this.updatedAt = new Date();
  next();
});

// TODO: Attach audio/video references when implementing media pipeline.

const Project = models.Project || model('Project', ProjectSchema);

export default Project;
