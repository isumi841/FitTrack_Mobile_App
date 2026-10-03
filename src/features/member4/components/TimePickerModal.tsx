/**
 * TimePickerModal – lightweight custom iOS-style time picker bottom sheet.
 * No third-party date picker library. Uses scroll-wheel simulation via ScrollView.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useM4Theme } from '../hooks/useM4Theme';

interface TimePickerModalProps {
  visible: boolean;
  initialHour?: number;
  initialMinute?: number;
  onClose: () => void;
  onConfirm: (hour: number, minute: number) => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);       // 1-12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);          // 0-59
const PERIODS = ['AM', 'PM'];

function WheelPicker({
  items,
  selectedIndex,
  onSelect,
  formatLabel,
  c,
}: {
  items: number[] | string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatLabel: (item: number | string) => string;
  c: ReturnType<typeof useM4Theme>;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to selected position
    scrollRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex]);

  function handleScrollEnd(e: { nativeEvent: { contentOffset: { y: number } } }) {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped !== selectedIndex) {
      onSelect(clamped);
    }
    // Snap
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  }

  return (
    <View style={{ height: PICKER_HEIGHT, overflow: 'hidden', flex: 1 }}>
      {/* Selection highlight */}
      <View
        style={[
          styles.selectionBar,
          {
            top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
            borderColor: c.teal,
            backgroundColor: c.tealDim,
          },
        ]}
        pointerEvents="none"
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
        }}
        scrollEventThrottle={16}
      >
        {(items as Array<number | string>).map((item, i) => {
          const isSelected = i === selectedIndex;
          return (
            <Pressable
              key={i}
              onPress={() => {
                onSelect(i);
                scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
              }}
              style={styles.pickerItem}
            >
              <Text
                style={[
                  styles.pickerText,
                  {
                    color: isSelected ? c.teal : c.muted,
                    fontWeight: isSelected ? '700' : '400',
                    fontSize: isSelected ? 20 : 16,
                  },
                ]}
              >
                {formatLabel(item)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TimePickerModal({
  visible,
  initialHour = 7,
  initialMinute = 0,
  onClose,
  onConfirm,
}: TimePickerModalProps) {
  const c = useM4Theme();

  // Convert 0-23 hour → 12h + AM/PM
  const init12 = initialHour % 12 || 12;
  const initPeriod = initialHour >= 12 ? 1 : 0;

  const [hourIdx, setHourIdx] = useState(init12 - 1);        // 0=1, 11=12
  const [minuteIdx, setMinuteIdx] = useState(initialMinute);
  const [periodIdx, setPeriodIdx] = useState(initPeriod);

  useEffect(() => {
    if (visible) {
      const h12 = initialHour % 12 || 12;
      setHourIdx(h12 - 1);
      setMinuteIdx(initialMinute);
      setPeriodIdx(initialHour >= 12 ? 1 : 0);
    }
  }, [visible, initialHour, initialMinute]);

  function handleDone() {
    const h12 = hourIdx + 1;
    const isAm = periodIdx === 0;
    let h24: number;
    if (isAm) {
      h24 = h12 === 12 ? 0 : h12;
    } else {
      h24 = h12 === 12 ? 12 : h12 + 12;
    }
    onConfirm(h24, minuteIdx);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: c.overlay }]} />
      </TouchableWithoutFeedback>

      <View style={styles.bottom} pointerEvents="box-none">
        <View style={[styles.sheet, { backgroundColor: c.bg2, borderColor: c.border }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: c.border }]} />

          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel time picker"
            >
              <Text style={[styles.topAction, { color: c.muted }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.topTitle, { color: c.text }]}>Select Time</Text>
            <Pressable
              onPress={handleDone}
              accessibilityRole="button"
              accessibilityLabel="Confirm time"
            >
              <Text style={[styles.topAction, { color: c.teal }]}>Done</Text>
            </Pressable>
          </View>

          {/* Wheels */}
          <View style={styles.wheelsRow}>
            {/* Hour */}
            <WheelPicker
              items={HOURS}
              selectedIndex={hourIdx}
              onSelect={setHourIdx}
              formatLabel={(item) => String(item)}
              c={c}
            />

            <Text style={[styles.colon, { color: c.text }]}>:</Text>

            {/* Minute */}
            <WheelPicker
              items={MINUTES}
              selectedIndex={minuteIdx}
              onSelect={setMinuteIdx}
              formatLabel={(item) => String(item as number).padStart(2, '0')}
              c={c}
            />

            {/* AM/PM */}
            <WheelPicker
              items={PERIODS}
              selectedIndex={periodIdx}
              onSelect={setPeriodIdx}
              formatLabel={(item) => item as string}
              c={c}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  topAction: {
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colon: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  selectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: {
    textAlign: 'center',
  },
});
