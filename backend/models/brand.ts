import mongoose from "mongoose";

interface BrandAttrs {
  name: string;
}

export interface BrandDoc extends mongoose.Document {
  name: string;
}

interface BrandModel extends mongoose.Model<BrandDoc> {
  build(attrs: BrandAttrs): BrandDoc;
}

const brandSchema = new mongoose.Schema(
  {
    name: { type: String },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

brandSchema.statics.build = (attrs: BrandAttrs) => {
  return new Brand(attrs);
};

const Brand = mongoose.model<BrandDoc, BrandModel>("Brand", brandSchema);

export { Brand };
