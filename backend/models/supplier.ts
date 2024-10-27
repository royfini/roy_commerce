import mongoose from "mongoose";

interface SupplierAttrs{
    name: string;
    phone: string;
    address: string;
}

interface SupplierDoc extends mongoose.Document{
    name: string;
    phone: string;
    address: string;
}

interface SupplierModel extends mongoose.Model<SupplierDoc>{
    build(attrs: SupplierAttrs): SupplierDoc;
}

const supplierSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String },
  address: { type: String },
});

supplierSchema.statics.build = (attrs: SupplierAttrs) => {
    return new Supplier(attrs);
};

const Supplier =  mongoose.model<SupplierDoc, SupplierModel>("Supplier", supplierSchema);

export { Supplier };
