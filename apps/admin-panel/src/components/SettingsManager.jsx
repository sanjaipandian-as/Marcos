import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  AlertTriangle, 
  Clock, 
  Award, 
  ShieldAlert,
  Check
} from 'lucide-react';
import api from '../utils/api';

export default function SettingsManager() {
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    businessHours: {
      monday: { isOpen: true, start: '09:00', end: '18:00' },
      tuesday: { isOpen: true, start: '09:00', end: '18:00' },
      wednesday: { isOpen: true, start: '09:00', end: '18:00' },
      thursday: { isOpen: true, start: '09:00', end: '18:00' },
      friday: { isOpen: true, start: '09:00', end: '18:00' },
      saturday: { isOpen: true, start: '09:00', end: '18:00' },
      sunday: { isOpen: true, start: '09:00', end: '18:00' }
    },
    pointsEarnRate: 10,
    pointsRedeemRate: 0.1,
    bookingSlotDurationMinutes: 60,
    maxBookingsPerSlot: 5,
    otpCooldownMinutes: 15,
    maxOtpFailures: 3
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const loaded = await api.getSettings();
        if (loaded) {
          setSettings({
            lowStockThreshold: loaded.lowStockThreshold || 10,
            businessHoursStart: loaded.businessHoursStart || '09:00',
            businessHoursEnd: loaded.businessHoursEnd || '18:00',
            businessHours: loaded.businessHours || {
              monday: { isOpen: true, start: '09:00', end: '18:00' },
              tuesday: { isOpen: true, start: '09:00', end: '18:00' },
              wednesday: { isOpen: true, start: '09:00', end: '18:00' },
              thursday: { isOpen: true, start: '09:00', end: '18:00' },
              friday: { isOpen: true, start: '09:00', end: '18:00' },
              saturday: { isOpen: true, start: '09:00', end: '18:00' },
              sunday: { isOpen: true, start: '09:00', end: '18:00' }
            },
            bookingSlotDurationMinutes: loaded.bookingSlotDurationMinutes || 60,
            maxBookingsPerSlot: loaded.maxBookingsPerSlot || 5,
            pointsEarnRate: loaded.pointsEarnRate || 10,
            pointsRedeemRate: loaded.pointsRedeemRate || 0.1,
            otpCooldownMinutes: loaded.otpCooldownMinutes || 15,
            maxOtpFailures: loaded.maxOtpFailures || 3
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    setError('');

    try {
      await api.saveSettings({
        lowStockThreshold: Number(settings.lowStockThreshold),
        businessHoursStart: settings.businessHoursStart,
        businessHoursEnd: settings.businessHoursEnd,
        businessHours: settings.businessHours,
        bookingSlotDurationMinutes: Number(settings.bookingSlotDurationMinutes),
        maxBookingsPerSlot: Number(settings.maxBookingsPerSlot),
        pointsEarnRate: Number(settings.pointsEarnRate),
        pointsRedeemRate: Number(settings.pointsRedeemRate),
        otpCooldownMinutes: Number(settings.otpCooldownMinutes),
        maxOtpFailures: Number(settings.maxOtpFailures)
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-none">
      <div className="border-b border-slate-150 pb-5">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-brand-500 animate-spin-slow" />
          <span>Platform Settings</span>
        </h2>
        <p className="text-sm text-slate-500 font-medium mt-1">Configure active database rules, store business operations calendar hours, loyalty program ratios, and security verification OTP limits.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8 w-full">
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
            <Check className="w-5 h-5 text-emerald-600" />
            <span>Platform configurations updated successfully and propagated to the active database!</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm font-bold animate-pulse shadow-sm">
            {error}
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-xs text-slate-655 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-extrabold text-slate-800 text-sm">Active Configuration Console</p>
            <p className="text-slate-500 mt-0.5">Changing these limits immediately alters core backend validation layers. All modifications are permanently recorded in the system audit logs.</p>
          </div>
          <span className="shrink-0 bg-slate-200/80 text-slate-700 py-1 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
            Mode: Production Live
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-premium space-y-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-850 text-base">Inventory Rules</h3>
                <p className="text-xs text-slate-400 font-semibold">Define threshold values for store logistics</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Low Stock Warning Threshold</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={e => setSettings({ ...settings, lowStockThreshold: e.target.value })}
                    className="w-full text-sm border border-slate-205 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-bold text-slate-800"
                    required
                  />
                  <span className="absolute right-4 text-xs text-slate-400 font-bold">Units</span>
                </div>
                <span className="text-xs text-slate-455 block leading-normal pt-1">Product quantities falling below this number will prompt low stock indicators on the Catalog dashboard.</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-premium space-y-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-850 text-base">Store Operations Hours</h3>
                <p className="text-xs text-slate-400 font-semibold">Set shop opening and closure timelines</p>
              </div>
            </div>

            <div className="space-y-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <div key={day} className="flex items-center justify-between gap-4 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                  <div className="flex items-center gap-3 w-1/3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.businessHours?.[day]?.isOpen ?? true}
                        onChange={(e) => {
                          const newHours = { ...settings.businessHours };
                          if (!newHours[day]) newHours[day] = { start: '09:00', end: '18:00' };
                          newHours[day].isOpen = e.target.checked;
                          setSettings({ ...settings, businessHours: newHours });
                        }}
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                    <span className="text-sm font-bold text-slate-700 capitalize">{day}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      disabled={!(settings.businessHours?.[day]?.isOpen ?? true)}
                      value={settings.businessHours?.[day]?.start || '09:00'}
                      onChange={(e) => {
                        const newHours = { ...settings.businessHours };
                        if (!newHours[day]) newHours[day] = { isOpen: true, end: '18:00' };
                        newHours[day].start = e.target.value;
                        setSettings({ ...settings, businessHours: newHours });
                      }}
                      className="w-full text-xs border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:bg-slate-100 font-bold text-slate-800"
                    />
                    <span className="text-slate-400 text-xs font-bold">to</span>
                    <input
                      type="time"
                      disabled={!(settings.businessHours?.[day]?.isOpen ?? true)}
                      value={settings.businessHours?.[day]?.end || '18:00'}
                      onChange={(e) => {
                        const newHours = { ...settings.businessHours };
                        if (!newHours[day]) newHours[day] = { isOpen: true, start: '09:00' };
                        newHours[day].end = e.target.value;
                        setSettings({ ...settings, businessHours: newHours });
                      }}
                      className="w-full text-xs border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:bg-slate-100 font-bold text-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-455 block leading-normal pt-2">Controls store availability and coordinates scheduler timeslots for home tailoring bookings.</span>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-premium space-y-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-850 text-base">Booking Configuration</h3>
                <p className="text-xs text-slate-400 font-semibold">Configure time slot intervals and capacities</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Meeting Duration</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={settings.bookingSlotDurationMinutes}
                    onChange={e => setSettings({ ...settings, bookingSlotDurationMinutes: e.target.value })}
                    className="w-full text-sm border border-slate-205 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-bold text-slate-800"
                    required
                  />
                  <span className="absolute right-4 text-xs text-slate-400 font-bold">Min</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Max Bookings Per Slot</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={settings.maxBookingsPerSlot}
                    onChange={e => setSettings({ ...settings, maxBookingsPerSlot: e.target.value })}
                    className="w-full text-sm border border-slate-205 rounded-xl py-3 pl-4 pr-16 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-bold text-slate-800"
                    required
                  />
                  <span className="absolute right-4 text-xs text-slate-400 font-bold">People</span>
                </div>
              </div>
            </div>
            <span className="text-xs text-slate-455 block leading-normal">Determines how long each booking session is (e.g. 15min) and how many concurrent users can book the same time window.</span>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-premium space-y-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-850 text-base">Loyalty Program Config</h3>
                <p className="text-xs text-slate-400 font-semibold">Adjust point accrual and redemption rates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Accrual Rate (Spend per Point)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={settings.pointsEarnRate}
                    onChange={e => setSettings({ ...settings, pointsEarnRate: e.target.value })}
                    className="w-full text-sm border border-slate-205 rounded-xl py-3 pl-8 pr-4 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-bold text-slate-800"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Redemption Value (Per Point)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.pointsRedeemRate}
                    onChange={e => setSettings({ ...settings, pointsRedeemRate: e.target.value })}
                    className="w-full text-sm border border-slate-205 rounded-xl py-3 pl-8 pr-4 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-bold text-slate-800"
                    required
                  />
                </div>
              </div>
            </div>
            <span className="text-xs text-slate-455 block leading-normal">Accrual represents the amount spent to earn 1 loyalty point. Redemption rate defines the Indian Rupee (₹) value of a single point during checkouts.</span>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-premium space-y-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-red-655" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-850 text-base">Verification & OTP Security</h3>
                <p className="text-xs text-slate-400 font-semibold">Configure anti-abuse verification thresholds</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">OTP Lockout Time</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={settings.otpCooldownMinutes}
                    onChange={e => setSettings({ ...settings, otpCooldownMinutes: e.target.value })}
                    className="w-full text-sm border border-slate-205 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-bold text-slate-800"
                    required
                  />
                  <span className="absolute right-4 text-xs text-slate-400 font-bold">Min</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Max Allowed Failures</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={settings.maxOtpFailures}
                    onChange={e => setSettings({ ...settings, maxOtpFailures: e.target.value })}
                    className="w-full text-sm border border-slate-205 rounded-xl py-3 pl-4 pr-16 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-bold text-slate-800"
                    required
                  />
                  <span className="absolute right-4 text-xs text-slate-400 font-bold">Attempts</span>
                </div>
              </div>
            </div>
            <span className="text-xs text-slate-455 block leading-normal">Defines OTP request restrictions. Customers exceeding the failures limit will be blocked for the lockout cooldown.</span>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving}
            className={`flex items-center gap-2 py-3.5 px-10 rounded-xl text-white text-sm font-extrabold transition-all shadow-md focus:outline-none ${
              isSaving ? 'bg-slate-500 cursor-not-allowed' : success ? 'bg-emerald-500' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : success ? (
              <>
                <Check className="w-5 h-5 text-white" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 text-white" />
                <span>Apply & Save Configurations</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
