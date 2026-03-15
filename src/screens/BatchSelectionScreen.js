import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

const BATCHES = [
  { id: 'A7', label: 'A7', subtitle: 'CET' },
  { id: 'A8', label: 'A8', subtitle: 'NEET' },
  { id: 'G7', label: 'G7', subtitle: 'CET + NEET' },

  { id: 'K7', label: 'K7', subtitle: 'CET' },
  { id: 'K8', label: 'K8', subtitle: 'NEET + JEE' },
  { id: 'K9', label: 'K9', subtitle: 'CET' },

  { id: 'S7', label: 'S7', subtitle: 'CET' },
  { id: 'S8', label: 'S8', subtitle: 'NEET' },
  { id: 'M12', label: 'M12', subtitle: 'NEET Repeater' }
];

export default function BatchSelectionScreen({ onNavigate }) {

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchText, setSearchText] = useState("");

  const handleContinue = () => {
    if (selectedBatch) {
      onNavigate('SubjectSelection');
    }
  };

  const filteredBatches = BATCHES.filter(batch =>
    batch.label.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>

        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onNavigate('Login')}
          >
            <ChevronLeft size={28} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.title}>Select Your Batch</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          Choose the batch you're enrolled in
        </Text>

        <TextInput
          style={styles.searchBar}
          placeholder="🔍 Search by batch code"
          placeholderTextColor="#94a3b8"
          value={searchText}
          onChangeText={setSearchText}
        />

      </View>

      {/* Batch List */}
      <ScrollView style={styles.listContainer}>

        {filteredBatches.map((batch) => {

          const isSelected = selectedBatch === batch.id;

          return (
            <TouchableOpacity
              key={batch.id}
              activeOpacity={0.8}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedBatch(batch.id)}
            >

              <View style={styles.batchIcon}>
                <Text style={styles.batchIconText}>{batch.label}</Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.batchName}>{batch.label} Batch</Text>

                <Text style={styles.batchCourse}>
                  {batch.subtitle} Preparation
                </Text>
              </View>

              <Text style={[styles.arrow, isSelected && styles.arrowActive]}>
                〉
              </Text>

            </TouchableOpacity>
          );
        })}

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            selectedBatch ? styles.buttonActive : styles.buttonDisabled
          ]}
          disabled={!selectedBatch}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue 〉</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#f6f8fc"
},

header:{
backgroundColor:"#2c4fb4",
padding:20,
borderBottomLeftRadius:20,
borderBottomRightRadius:20
},

headerTop:{
flexDirection:"row",
alignItems:"center",
marginBottom:4
},

backButton:{
marginRight:8
},

title:{
fontSize:22,
fontWeight:"bold",
color:"#ffffff"
},

headerSubtitle:{
fontSize:14,
color:"#dbe3ff",
marginBottom:12
},

searchBar:{
backgroundColor:"#ffffff",
padding:12,
borderRadius:10
},

listContainer:{
padding:16
},

card:{
flexDirection:"row",
alignItems:"center",
backgroundColor:"#fff",
padding:16,
borderRadius:14,
marginBottom:12,
shadowColor:"#000",
shadowOpacity:0.05,
shadowRadius:4,
elevation:2
},

cardSelected:{
borderWidth:2,
borderColor:"#2c4fb4"
},

batchIcon:{
width:50,
height:50,
borderRadius:25,
backgroundColor:"#eef2ff",
alignItems:"center",
justifyContent:"center"
},

batchIconText:{
fontWeight:"bold",
fontSize:16,
color:"#2c4fb4"
},

cardContent:{
flex:1,
marginLeft:12
},

batchName:{
fontSize:16,
fontWeight:"600",
color:"#1e293b"
},

batchCourse:{
fontSize:13,
color:"#64748b",
marginTop:2
},

arrow:{
fontSize:18,
color:"#94a3b8"
},

arrowActive:{
color:"#2c4fb4"
},

footer:{
padding:16
},

button:{
padding:16,
borderRadius:12,
alignItems:"center"
},

buttonActive:{
backgroundColor:"#2c4fb4"
},

buttonDisabled:{
backgroundColor:"#c7d2fe"
},

buttonText:{
color:"#fff",
fontWeight:"bold",
fontSize:16
}

});