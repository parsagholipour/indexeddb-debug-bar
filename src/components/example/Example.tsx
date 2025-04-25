import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useLiveQuery } from 'dexie-react-hooks';
import Dexie from "dexie";

const Example = ({ db }: {db: string | Dexie}) => {
  const [newProduct, setNewProduct] = useState({
    name: 'Name X',
    description: 'Description X',
    imageUrl: '1.png',
    price: Math.floor(Math.random() * 1000),
    userId: '1'
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProductData, setEditingProductData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    price: '',
    userId: ''
  });
  const [showForm, setShowForm] = useState(false);
  const containerRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Initialization: if no data, insert initial users and products.
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    const initData = async () => {
      // Initialize users if empty
      const userCount = await db.users.count();
      if (userCount === 0) {
        await db.users.bulkAdd([
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Charlie' }
        ]);
      }
      // Initialize products if empty
      const productCount = await db.products.count();
      if (productCount === 0) {
        await db.products.bulkAdd([
          {
            id: 1,
            name: 'Product 1',
            description: 'Description 1',
            imageUrl: '1.png',
            price: 19.99
          },
          {
            id: 2,
            name: 'Product 2',
            description: 'Description 2',
            imageUrl: '2.png',
            price: 29.99
          },
          {
            id: 3,
            name: 'Product 3',
            description: 'Description 3',
            imageUrl: '3.png',
            price: 39.99
          }
        ]);
        // Associate each product with a user for demonstration.
        await db.productUser.bulkAdd([
          { userId: 1, productId: 1 },
          { userId: 2, productId: 2 },
          { userId: 3, productId: 3 }
        ]);
      }
    };
    initData();
  }, [db]);

  // Live query to fetch products along with their associated user.
  const products = useLiveQuery(async () => {
    const prods = await db.products.toArray();
    const productsWithUser = await Promise.all(
      prods.map(async (prod) => {
        const association = await db.productUser
          .where('productId')
          .equals(prod.id)
          .first();
        return { ...prod, userId: association ? association.userId : '' };
      })
    );
    return productsWithUser;
  }, [db], []);

  // Live query to fetch users.
  const users = useLiveQuery(() => db.users.toArray(), [db], []);

  // Create a new product and optionally add a user association.
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProduct.name) return;
    const id = Math.floor(Math.random() * 1000);
    await db.products.add({
      id,
      name: newProduct.name,
      description: newProduct.description,
      imageUrl: newProduct.imageUrl,
      price: parseFloat(newProduct.price)
    });
    if (newProduct.userId) {
      await db.productUser.add({ userId: parseInt(newProduct.userId), productId: id });
    }
    // Optionally reset the form here.
    // setNewProduct({ name: '', description: '', imageUrl: '', price: '', userId: '' });
  };

  // Delete a product and its associated user record.
  const handleDelete = async (id) => {
    await db.products.delete(id);
    await db.productUser.where('productId').equals(id).delete();
  };

  // Start editing a product.
  const startEditing = (product) => {
    setEditingProductId(product.id);
    setEditingProductData({
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      userId: product.userId || ''
    });
  };

  // Save changes made during editing.
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    await db.products.update(editingProductId, {
      name: editingProductData.name,
      description: editingProductData.description,
      imageUrl: editingProductData.imageUrl,
      price: parseFloat(editingProductData.price)
    });
    // Remove old association and add a new one if needed.
    await db.productUser.where('productId').equals(editingProductId).delete();
    if (editingProductData.userId) {
      await db.productUser.add({ userId: parseInt(editingProductData.userId), productId: editingProductId });
    }
    setEditingProductId(null);
    setEditingProductData({ name: '', description: '', imageUrl: '', price: '', userId: '' });
  };

  // glow effect on each product card.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleMouseMove = (e) => {
      const cards = container.querySelectorAll('.product-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const dx = e.clientX - cardCenterX;
        const dy = e.clientY - cardCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Adjust intensity: maximum when close, fades to 0 at 200px.
        const intensity = Math.max(0, 0.9 - distance / 400);
        // Calculate relative cursor position within the card (as a percentage).
        const relX = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
        const relY = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
        card.style.setProperty('--glow-x', `${relX}%`);
        card.style.setProperty('--glow-y', `${relY}%`);
        card.style.setProperty('--glow-intensity', intensity);
      });
    };

    const handleMouseLeave = () => {
      const cards = container.querySelectorAll('.product-card');
      cards.forEach(card => {
        card.style.setProperty('--glow-intensity', 0);
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="px-2 pb-5 bg-gray-900 text-white min-h-screen">
      <div className="flex items-center pb-4 px-1 pt-3">
        <img src={import.meta.env.BASE_URL + 'logo.png'} alt="logo" className={'max-h-16 rounded-full'} />
        <h1 className="text-3xl font-bold">
          <span
            className={'text-purple-400'}
            style={{ textShadow: '5px 1px 1px 2px #fc77f7' }}
          >
            IndexedDB Debug Bar
          </span>{' '}
          Demo
        </h1>
      </div>

      {/* Style for dynamic glow effect */}
      <style>{`
        .product-card {
          position: relative;
          z-index: 0;
          overflow: hidden;
        }
        .product-card::before {
          content: "";
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          z-index: -1;
          border-radius: inherit;
          background: radial-gradient(
            circle at var(--glow-x, 50%) var(--glow-y, 50%),
            rgba(252, 119, 247, var(--glow-intensity, 0)) 0%,
            transparent 60%
          );
          transition: background 0.1s ease;
        }
      `}</style>

      {/* Container for product cards with a ref for mouse tracking */}
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {products &&
          products.map((product) => (
            <div key={product.id} className="product-card bg-gray-800 p-0.5 rounded shadow">
              {editingProductId === product.id ? (
                // Editing mode: show a form for updating the product.
                <form className={'px-2 bg-gray-800 h-full'} onSubmit={handleSaveEdit}>
                  <div className="mb-2">
                    <input
                      type="text"
                      value={editingProductData.name}
                      onChange={(e) =>
                        setEditingProductData({
                          ...editingProductData,
                          name: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <textarea
                      value={editingProductData.description}
                      onChange={(e) =>
                        setEditingProductData({
                          ...editingProductData,
                          description: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      type="text"
                      value={editingProductData.imageUrl}
                      onChange={(e) =>
                        setEditingProductData({
                          ...editingProductData,
                          imageUrl: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                      placeholder="Image URL"
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editingProductData.price}
                      onChange={(e) =>
                        setEditingProductData({
                          ...editingProductData,
                          price: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                      placeholder="Price"
                    />
                  </div>
                  <div className="mb-2">
                    <select
                      value={editingProductData.userId}
                      onChange={(e) =>
                        setEditingProductData({
                          ...editingProductData,
                          userId: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                    >
                      <option value="">Select a user</option>
                      {users &&
                        users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || `User ${user.id}`}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProductId(null)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // Display mode: show product details.
                <div className={'bg-gray-800 p-4'}>
                  <img
                    src={import.meta.env.BASE_URL + product.imageUrl}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded mb-2"
                  />
                  <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                  <p className="text-gray-300 mb-1">{product.description}</p>
                  <p className="mb-1">
                    <strong>Price:</strong> ${parseFloat(product.price).toFixed(2)}
                  </p>
                  <p className="mb-3">
                    <strong>User:</strong>{' '}
                    {product.userId
                      ? users &&
                      users.find((u) => u.id === product.userId)?.name ||
                      `User ${product.userId}`
                      : 'None'}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(product)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      <div className="flex flex-col items-center bg-gray-800 p-4 rounded shadow">
        <button
          onClick={() => setShowForm((old) => !old)}
          className={clsx(['mx-auto py-2 rounded px-3', showForm ? 'bg-red-500' : 'bg-green-500'])}
        >
          {showForm ? 'Close' : 'Add New Product'}
        </button>
        {/* Form to create a new product */}
        {showForm && (
          <form className="w-full" onSubmit={handleCreate}>
            <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
            <div className="mb-4">
              <label className="block mb-1">Name</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                placeholder="Product Name"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Description</label>
              <textarea
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                placeholder="Product Description"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Image URL</label>
              <input
                type="text"
                value={newProduct.imageUrl}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, imageUrl: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                placeholder="Price"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Associate User</label>
              <select
                value={newProduct.userId}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, userId: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              >
                <option value="">Select a user</option>
                {users &&
                  users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || `User ${user.id}`}
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Create Product
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Example;
