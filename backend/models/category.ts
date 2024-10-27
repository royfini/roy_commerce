import mongoose from "mongoose";

interface CategoryAttrs {
  name: string;
}

export interface CategoryDoc extends mongoose.Document {
  name: string;
}

interface CategoryModel extends mongoose.Model<CategoryDoc> {
  build(attrs: CategoryAttrs): CategoryDoc;
}

const categorySchema = new mongoose.Schema({
  name: { type: String },
},
{
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
    },
  },
});

categorySchema.statics.build = (attrs: CategoryAttrs) => {
  return new Category(attrs);
};

const Category = mongoose.model<CategoryDoc,CategoryModel>("Category", categorySchema);

export { Category };
