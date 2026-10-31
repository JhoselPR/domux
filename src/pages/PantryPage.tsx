import { useEffect, useState, useCallback } from 'react';
import { useHouseholdStore } from '@/stores/householdStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, SectionTitle } from '@/components/ui/PageHeader';
import { Plus, CheckCircle2, Circle, ShoppingCart, Trash2, DollarSign } from 'lucide-react';
import type { PantryItem } from '@/types/database';
import { formatMoney } from '@/lib/format';

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

  useEffect(() => {
    const load = async () => {
      await fetchItems();
    };

    void load();
  }, [fetchItems]);

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
    <div className="animate-fade-in">
      <PageHeader title="Despensa" subtitle="Lo que hay que comprar" actions={<Button onClick={() => setShowAddModal(true)} icon={<Plus size={16} />}>Agregar</Button>} />

      {/* Unbought Items */}
      <div className="mb-8">
        <SectionTitle count={unbought.length}>Por comprar</SectionTitle>
        {unbought.length === 0 ? (
          <Card><p className="text-sm text-ink-3">La lista está vacía</p></Card>
        ) : (
          <Card padding="none" className="divide-y divide-line">
            {unbought.map((item) => (
              <div key={item.id} className="group flex min-h-12 items-center gap-3 px-4 py-2">
                <button onClick={() => markBought(item)} className="shrink-0 cursor-pointer text-ink-3 transition-colors hover:text-accent" aria-label="Marcar producto como comprado"><Circle size={18} /></button>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{item.name}</p>
                {item.quantity > 1 && <span className="font-mono text-xs tabular-nums text-ink-3">×{item.quantity}</span>}
                <button onClick={() => deleteItem(item.id)} className="cursor-pointer text-ink-3 transition-[color,opacity] hover:text-danger focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0" aria-label="Eliminar producto"><Trash2 size={16} /></button>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Bought Items */}
      {bought.length > 0 && (
        <div>
          <SectionTitle count={bought.length}>Comprados</SectionTitle>
          <Card padding="none" className="divide-y divide-line">
            {bought.map((item) => (
              <div key={item.id} className="flex min-h-12 items-center gap-3 px-4 py-2">
                <button onClick={() => markBought(item)} className="shrink-0 cursor-pointer text-ink-3 transition-colors hover:text-ink" aria-label="Marcar producto como pendiente"><CheckCircle2 size={18} /></button>
                <div className="min-w-0 flex-1"><span className="struck text-sm text-ink-2">{item.name}</span></div>
                {item.price != null && <span className="font-mono text-xs tabular-nums text-ink-2">{formatMoney(item.price)}</span>}
                <button onClick={() => deleteItem(item.id)} className="cursor-pointer text-ink-3 transition-colors hover:text-danger" aria-label="Eliminar producto"><Trash2 size={16} /></button>
              </div>
            ))}
            <div className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
              <span className="text-sm text-ink-2">Total gastado en despensa</span>
              <span className="mr-7 font-mono text-sm font-medium tabular-nums text-ink">{formatMoney(totalSpent)}</span>
            </div>
          </Card>
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
          {price && <p className="text-xs text-ink-2">Al añadir precio, se marcará como comprado y se añadirá a gastos.</p>}
          <Button type="submit" loading={loading} fullWidth>Agregar a la lista</Button>
        </form>
      </Modal>

      {/* Price Modal */}
      <Modal isOpen={!!priceModal} onClose={() => { setPriceModal(null); setPrice(''); }} title="¿Agregar precio?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-2">Marcando <span className="font-medium text-ink">{priceModal?.name}</span> como comprado. ¿Deseas registrar el precio?</p>
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
