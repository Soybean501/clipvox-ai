import { Schema, model, models, Types, type HydratedDocument, type Model } from 'mongoose';

export interface ProjectAttributes {
  ownerId: Types.ObjectId;
  title: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<ProjectAttributes>({
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

export type ProjectDocument = HydratedDocument<ProjectAttributes>;
export type ProjectLean = ProjectAttributes & { _id: Types.ObjectId };

const Project =
  (models.Project as Model<ProjectAttributes> | undefined) || model<ProjectAttributes>('Project', ProjectSchema);

export default Project;
