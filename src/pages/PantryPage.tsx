import { useEffect, useState, useCallback } from 'react';
import { useHouseholdStore } from '@/stores/householdStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Check, ShoppingCart, Trash2, DollarSign } from 'lucide-react';
import type { PantryItem } from '@/types/database';
import { clsx } from 'clsx';

export function PantryPage() {
  const { activeHouseholdId } = useHouseholdStore();
  const { user } = useAuthStore();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [priceModal, setPriceModal] = useState<PantryItem | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!activeHouseholdId) return;
    const { data } = await supabase.from('pantry_items').select('*')
      .eq('household_id', activeHouseholdId).order('is_bought', { ascending: true }).order('created_at', { ascending: false });
    setItems((data as PantryItem[]) || []);
  }, [activeHouseholdId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHouseholdId || !user) return;
    setLoading(true);

    const itemPrice = price ? parseFloat(price) : null;
    const isBought = itemPrice !== null;

    const { data: newItem } = await supabase.from('pantry_items').insert({
      household_id: activeHouseholdId, 
      name, 
      quantity: parseInt(quantity) || 1,
      is_bought: isBought, 
      price: itemPrice,
      bought_at: isBought ? new Date().toISOString() : null,
      added_by: user.id,
    }).select().single();

    if (isBought && newItem) {
      await supabase.from('expenses').insert({
        household_id: activeHouseholdId,
        category: 'other',
        amount: itemPrice,
        date: new Date().toISOString().split('T')[0],
        description: `Despensa: ${name}`,
        created_by: user.id
      });
    }

    setName(''); setQuantity('1'); setPrice(''); setShowAddModal(false); setLoading(false);
    fetchItems();
  };

  const markBought = async (item: PantryItem) => {
    if (!item.is_bought) {
      setPriceModal(item);
    } else {
      await supabase.from('pantry_items').update({ is_bought: false, price: null, bought_at: null }).eq('id', item.id);
      fetchItems();
    }
  };

  const confirmBought = async (withPrice: boolean) => {
    if (!priceModal) return;
    setLoading(true);
    
    const itemPrice = withPrice && price ? parseFloat(price) : null;

    await supabase.from('pantry_items').update({
      is_bought: true, bought_at: new Date().toISOString(),
      price: itemPrice,
    }).eq('id', priceModal.id);

    if (itemPrice && activeHouseholdId && user) {
      await supabase.from('expenses').insert({
        household_id: activeHouseholdId,
        category: 'other',
        amount: itemPrice,
        date: new Date().toISOString().split('T')[0],
        description: `Despensa: ${priceModal.name}`,
        created_by: user.id
      });
    }

    setPriceModal(null); setPrice(''); setLoading(false);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('pantry_items').delete().eq('id', id);
    fetchItems();
  };

  const unbought = items.filter((i) => !i.is_bought);
  const bought = items.filter((i) => i.is_bought);
  const totalSpent = bought.reduce((sum, i) => sum + (i.price || 0), 0);

  return (
    <div className="sm:ml-16 lg:ml-56 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Despensa</h1>
          <p className="text-surface-600 text-sm mt-1">Lista de compras del hogar</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={<Plus size={16} />}>Agregar</Button>
      </div>

      {/* Total Spent Card */}
      {bought.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-600">Total gastado en despensa</p>
              <p className="text-2xl font-bold text-surface-900">${totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <DollarSign size={24} className="text-primary-500" />
          </div>
        </Card>
      )}

      {/* Unbought Items */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wider mb-3">Por comprar ({unbought.length})</h2>
        {unbought.length === 0 ? (
          <Card><p className="text-sm text-surface-500 text-center py-4">¡Lista vacía! Agrega productos 🛒</p></Card>
        ) : (
          <div className="flex flex-col gap-2">
            {unbought.map((item) => (
              <Card key={item.id} padding="sm" className="group">
                <div className="flex items-center gap-3">
                  <button onClick={() => markBought(item)} className="w-6 h-6 rounded-full border-2 border-surface-300 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900">{item.name}</p>
                    {item.quantity > 1 && <p className="text-xs text-surface-500">Cantidad: {item.quantity}</p>}
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-danger-500 transition-all cursor-pointer"><Trash2 size={16} /></button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bought Items */}
      {bought.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wider mb-3">Comprados ({bought.length})</h2>
          <div className="flex flex-col gap-2">
            {bought.map((item) => (
              <Card key={item.id} padding="sm" className="opacity-60">
                <div className="flex items-center gap-3">
                  <button onClick={() => markBought(item)} className="text-success-500 cursor-pointer shrink-0"><Check size={20} /></button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-700 line-through">{item.name}</p>
                  </div>
                  {item.price != null && <span className="text-sm font-medium text-surface-600">${item.price.toFixed(2)}</span>}
                  <button onClick={() => deleteItem(item.id)} className="text-surface-400 hover:text-danger-500 transition-all cursor-pointer"><Trash2 size={16} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setPrice(''); }} title="Agregar producto">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Input label="Producto" placeholder="Ej: Leche" value={name} onChange={(e) => setName(e.target.value)} icon={<ShoppingCart size={16} />} required />
          <div className="flex gap-4">
            <div className="flex-1">
              <Input label="Cantidad" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="flex-1">
              <Input label="Precio (opcional)" type="number" step="0.01" min="0" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} icon={<DollarSign size={16} />} />
            </div>
          </div>
          {price && <p className="text-xs text-primary-600">Al añadir precio, se marcará como comprado y se añadirá a gastos.</p>}
          <Button type="submit" loading={loading} fullWidth>Agregar a la lista</Button>
        </form>
      </Modal>

      {/* Price Modal */}
      <Modal isOpen={!!priceModal} onClose={() => { setPriceModal(null); setPrice(''); }} title="¿Agregar precio?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-surface-600">Marcando <strong>{priceModal?.name}</strong> como comprado. ¿Deseas registrar el precio?</p>
          <Input label="Precio (opcional)" type="number" step="0.01" min="0" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} icon={<DollarSign size={16} />} />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => confirmBought(false)} fullWidth className="flex-1">Sin precio</Button>
            <Button onClick={() => confirmBought(true)} loading={loading} fullWidth className="flex-1" disabled={!price}>Guardar precio</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
